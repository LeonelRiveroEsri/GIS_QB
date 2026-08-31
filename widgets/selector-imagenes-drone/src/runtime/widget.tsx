import { React, type AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView, loadArcGISJSAPIModules } from 'jimu-arcgis'
import type { IMConfig } from '../config'
import defaultMessages from './translations/default'
import { getStyle } from './style'

interface DatedLayer {
  id: string
  title: string
  layer: __esri.Layer
  date: Date
  iso: string
}

interface SwipePlacement {
  layer: __esri.Layer
  group: __esri.GroupLayer
  index: number
}

const SearchIcon = () => <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><circle cx='11' cy='11' r='7'/><path d='m20 20-4-4'/></svg>
const ImageIcon = () => <svg width='25' height='25' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7'><rect x='3' y='4' width='18' height='16' rx='2'/><circle cx='15.5' cy='9' r='2'/><path d='m4 17 5-5 4 4 2-2 5 4'/></svg>
const EmptyIcon = () => <svg width='38' height='38' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'><rect x='3' y='4' width='18' height='16' rx='2'/><path d='m4 17 5-5 3 3 2-2 6 5M8 8h.01'/></svg>
const CheckIcon = () => <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3'><path d='m5 12 4 4L19 6'/></svg>
const Chevron = ({ right = false }: { right?: boolean }) => <svg width='17' height='17' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d={right ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'}/></svg>

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const [jmv, setJmv] = React.useState<JimuMapView>(undefined)
  const [items, setItems] = React.useState<DatedLayer[]>([])
  const [activeId, setActiveId] = React.useState('')
  const [compareId, setCompareId] = React.useState('')
  const [compareMode, setCompareMode] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [year, setYear] = React.useState('')
  const [from, setFrom] = React.useState('')
  const [to, setTo] = React.useState('')
  const [opacityById, setOpacityById] = React.useState<Record<string, number>>({})
  const [detectedGroupTitle, setDetectedGroupTitle] = React.useState('')
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'group' | 'empty' | 'ready'>('idle')
  const collectionHandle = React.useRef<{ remove: () => void }>(undefined)
  const swipePlacementsRef = React.useRef<SwipePlacement[]>([])
  const swipeClipsRef = React.useRef<Array<{ layerView: any, clip: any }>>([])
  const swipeOverlayRef = React.useRef<HTMLDivElement>(undefined)
  const swipePointerCleanupRef = React.useRef<() => void>(undefined)
  const suppressGroupEventsUntilRef = React.useRef(0)
  const initialized = React.useRef(false)
  // El widget se presenta siempre en español, independientemente del idioma
  // del Builder. Esto también evita colisiones con mensajes genéricos como
  // "search", "to" o "layer" registrados por Experience Builder.
  const t = React.useCallback((id: string) => defaultMessages[id] || id, [])

  const parseDate = React.useCallback((title: string): { date: Date, iso: string } | null => {
    try {
      const regex = new RegExp(props.config.datePattern || '(\\d{2}|\\d{4})[_-](\\d{2})[_-](\\d{2})')
      const match = title.match(regex)
      if (!match || match.length < 4) return null
      const rawYear = Number(match[1])
      const year = match[1].length === 2 ? 2000 + rawYear : rawYear
      const month = Number(match[2])
      const day = Number(match[3])
      const date = new Date(year, month - 1, day)
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
      return { date, iso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` }
    } catch {
      return null
    }
  }, [props.config.datePattern])

  const scanMap = React.useCallback(async (mapView: JimuMapView) => {
    setStatus('loading')
    const map = mapView.view?.map
    if (!map) return
    const allLayers = map.allLayers?.toArray?.() || []
    let group = allLayers.find((layer: __esri.Layer) =>
      layer.type === 'group' && layer.title.trim().toLocaleLowerCase() === (props.config.groupTitle || 'Imagenes Drone').trim().toLocaleLowerCase()
    ) as __esri.GroupLayer

    // If this web map uses another group name, choose the group containing
    // the highest number of direct children that match the date convention.
    if (!group) {
      group = allLayers
        .filter((layer: __esri.Layer) => layer.type === 'group')
        .map((candidate: __esri.GroupLayer) => ({
          candidate,
          datedCount: candidate.layers?.toArray?.().filter((child: __esri.Layer) => Boolean(parseDate(child.title || ''))).length || 0
        }))
        .filter(result => result.datedCount > 0)
        .sort((a, b) => b.datedCount - a.datedCount)[0]?.candidate
    }
    if (!group) {
      setItems([])
      setDetectedGroupTitle('')
      setStatus('group')
      return
    }
    setDetectedGroupTitle(group.title)
    await group.load()
    const dated: DatedLayer[] = (group.layers?.toArray?.() || [])
      .map((layer: __esri.Layer) => {
        const parsed = parseDate(layer.title || '')
        return parsed ? { id: layer.id, title: layer.title, layer, ...parsed } : null
      })
      .filter(Boolean)
      .sort((a: DatedLayer, b: DatedLayer) => b.date.getTime() - a.date.getTime())

    setItems(dated)
    if (!dated.length) {
      setStatus('empty')
      return
    }
    setStatus('ready')

    const visible = dated.find(item => item.layer.visible)
    const preferred = props.config.autoSelectLatest && !initialized.current ? dated[0] : (visible || dated[0])
    dated.forEach(item => { item.layer.visible = item.id === preferred.id })
    setActiveId(preferred.id)
    setCompareId(dated.find(item => item.id !== preferred.id)?.id || '')
    initialized.current = true

    collectionHandle.current?.remove()
    collectionHandle.current = group.layers.on('change', () => {
      if (Date.now() < suppressGroupEventsUntilRef.current) return
      window.setTimeout(() => scanMap(mapView), 0)
    })
  }, [parseDate, props.config.autoSelectLatest, props.config.groupTitle])

  const removeSwipe = React.useCallback(() => {
    swipeClipsRef.current.forEach(({ layerView, clip }) => layerView.clips?.remove(clip))
    swipeClipsRef.current = []
    swipePointerCleanupRef.current?.()
    swipePointerCleanupRef.current = undefined
    swipeOverlayRef.current?.remove()
    swipeOverlayRef.current = undefined
    if (swipePlacementsRef.current.length && jmv?.view?.map) {
      suppressGroupEventsUntilRef.current = Date.now() + 1200
      const placements = [...swipePlacementsRef.current].sort((a, b) => a.index - b.index)
      placements.forEach(({ layer }) => jmv.view.map.remove(layer))
      placements.forEach(({ layer, group, index }) => group.layers.add(layer, index))
      swipePlacementsRef.current = []
    }
  }, [jmv])

  React.useEffect(() => () => {
    collectionHandle.current?.remove()
    swipeClipsRef.current.forEach(({ layerView, clip }) => layerView.clips?.remove(clip))
    swipeClipsRef.current = []
    swipePointerCleanupRef.current?.()
    swipeOverlayRef.current?.remove()
    swipePlacementsRef.current = []
  }, [])

  const onViewChange = React.useCallback((view: JimuMapView) => {
    setJmv(view)
    initialized.current = false
    void scanMap(view)
  }, [scanMap])

  const years = React.useMemo(() =>
    Array.from(new Set(items.map(item => item.date.getFullYear())))
      .sort((a, b) => b - a)
  , [items])

  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    return items.filter(item =>
      (!normalized || item.title.toLocaleLowerCase().includes(normalized) || item.iso.includes(normalized)) &&
      (!year || item.date.getFullYear() === Number(year)) &&
      (!from || item.iso >= from) &&
      (!to || item.iso <= to)
    )
  }, [items, query, year, from, to])

  const adjacentComparison = React.useMemo(() => {
    const index = filtered.findIndex(item => item.id === activeId)
    if (index < 0) return null
    return filtered[index + 1] || filtered[index - 1] || null
  }, [filtered, activeId])

  const comparisonImage = React.useMemo(() =>
    filtered.find(item => item.id === compareId && item.id !== activeId) || adjacentComparison
  , [filtered, compareId, activeId, adjacentComparison])

  React.useEffect(() => {
    if (!filtered.length) {
      setCompareMode(false)
      setCompareId('')
      return
    }
    if (!filtered.some(item => item.id === activeId)) {
      const next = filtered[0]
      setActiveId(next.id)
      setCompareId(filtered[1]?.id || '')
    }
  }, [filtered, activeId])

  React.useEffect(() => {
    if (filtered.length < 2) {
      setCompareMode(false)
      setCompareId('')
      return
    }
    const comparisonIsValid = filtered.some(item => item.id === compareId && item.id !== activeId)
    if (!comparisonIsValid) setCompareId(adjacentComparison?.id || '')
  }, [filtered, activeId, compareId, adjacentComparison])

  const selectPrimary = React.useCallback(async (id: string) => {
    const chosen = items.find(item => item.id === id)
    if (!chosen) return
    items.forEach(item => {
      item.layer.visible = item.id === id || (compareMode && item.id === compareId)
      item.layer.opacity = opacityById[item.id] ?? 1
    })
    setActiveId(id)
    if (compareId === id || !filtered.some(item => item.id === compareId)) {
      const selectedIndex = filtered.findIndex(item => item.id === id)
      setCompareId(filtered[selectedIndex + 1]?.id || filtered[selectedIndex - 1]?.id || '')
    }
    if (props.config.zoomOnSelect && jmv?.view) {
      try {
        await chosen.layer.load()
        const extent = chosen.layer.fullExtent
        if (extent) {
          await jmv.view.goTo(extent.expand(1.12), {
            duration: 900,
            easing: 'ease-in-out'
          })
        }
      } catch (error) {
        console.warn('No fue posible acercar a la extensión de la imagen seleccionada.', error)
      }
    }
  }, [items, filtered, compareMode, compareId, opacityById, props.config.zoomOnSelect, jmv])

  React.useEffect(() => {
    if (!items.length) return
    items.forEach(item => {
      const isComparison = compareMode && item.id === comparisonImage?.id && item.id !== activeId
      item.layer.visible = item.id === activeId || isComparison
      item.layer.opacity = opacityById[item.id] ?? 1
    })
  }, [compareMode, comparisonImage, activeId, items, opacityById])

  const cycleOpacity = React.useCallback((item: DatedLayer) => {
    const current = opacityById[item.id] ?? 1
    const next = current > 0.75 ? 0.75 : current > 0.5 ? 0.5 : current > 0.25 ? 0.25 : 1
    item.layer.opacity = next
    setOpacityById(previous => ({ ...previous, [item.id]: next }))
  }, [opacityById])

  React.useEffect(() => {
    let cancelled = false

    const createSwipe = async () => {
      removeSwipe()
      if (!compareMode || !jmv?.view) return

      const primary = items.find(item => item.id === activeId)
      const comparison = comparisonImage
      if (!primary || !comparison || primary.id === comparison.id) return

      await Promise.all([primary.layer.load(), comparison.layer.load()])
      const [ClipRect] = await loadArcGISJSAPIModules([
        'esri/views/layers/support/ClipRect'
      ]) as [typeof import('esri/views/layers/support/ClipRect').default]
      if (cancelled) return

      // Two children of one GroupLayer share a composite LayerView, so Swipe
      // intersects both clips and blanks it. Moving the original layers to the
      // map root creates independent LayerViews while preserving every service
      // property, authentication setting and tile configuration.
      const primaryGroup = primary.layer.parent as __esri.GroupLayer
      const comparisonGroup = comparison.layer.parent as __esri.GroupLayer
      if (primaryGroup?.type !== 'group' || comparisonGroup?.type !== 'group') return

      const placements: SwipePlacement[] = [
        { layer: primary.layer, group: primaryGroup, index: primaryGroup.layers.indexOf(primary.layer) },
        { layer: comparison.layer, group: comparisonGroup, index: comparisonGroup.layers.indexOf(comparison.layer) }
      ]
      suppressGroupEventsUntilRef.current = Date.now() + 1200
      placements.forEach(({ layer, group }) => group.layers.remove(layer))
      jmv.view.map.addMany([primary.layer, comparison.layer])
      swipePlacementsRef.current = placements
      primary.layer.visible = true
      comparison.layer.visible = true
      const [primaryLayerView, comparisonLayerView] = await Promise.all([
        jmv.view.whenLayerView(primary.layer),
        jmv.view.whenLayerView(comparison.layer)
      ])
      if (cancelled) {
        removeSwipe()
        return
      }

      const leadingClip = new ClipRect({ left: 0, top: 0, right: '50%', bottom: 0 })
      const trailingClip = new ClipRect({ left: '50%', top: 0, right: 0, bottom: 0 })
      const leadingView = primaryLayerView as any
      const trailingView = comparisonLayerView as any
      if (!leadingView.clips || !trailingView.clips) {
        throw new Error('Las vistas de estas capas no admiten recorte Swipe.')
      }
      leadingView.clips.add(leadingClip)
      trailingView.clips.add(trailingClip)
      swipeClipsRef.current = [
        { layerView: leadingView, clip: leadingClip },
        { layerView: trailingView, clip: trailingClip }
      ]

      const overlay = document.createElement('div')
      overlay.setAttribute('aria-hidden', 'true')
      Object.assign(overlay.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '20',
        pointerEvents: 'none',
        overflow: 'hidden'
      })
      const divider = document.createElement('div')
      Object.assign(divider.style, {
        position: 'absolute',
        left: '50%',
        top: '0',
        bottom: '0',
        width: '3px',
        marginLeft: '-1px',
        background: '#ffffff',
        borderLeft: '1px solid rgba(23,37,42,.65)',
        borderRight: '1px solid rgba(23,37,42,.65)',
        cursor: 'col-resize',
        pointerEvents: 'auto',
        touchAction: 'none',
        boxShadow: '0 0 4px rgba(0,0,0,.25)'
      })
      const handle = document.createElement('div')
      handle.textContent = '↔'
      Object.assign(handle.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '34px',
        height: '38px',
        display: 'grid',
        placeItems: 'center',
        color: '#075f59',
        fontSize: '18px',
        background: '#ffffff',
        border: '1px solid #547078',
        borderRadius: '5px',
        boxShadow: '0 2px 7px rgba(0,0,0,.2)'
      })
      divider.appendChild(handle)
      overlay.appendChild(divider)
      ;(jmv.view.container as HTMLDivElement).appendChild(overlay)
      swipeOverlayRef.current = overlay

      const updatePosition = (clientX: number) => {
        const bounds = (jmv.view.container as HTMLDivElement).getBoundingClientRect()
        const percent = Math.max(2, Math.min(98, ((clientX - bounds.left) / bounds.width) * 100))
        divider.style.left = `${percent}%`
        leadingClip.right = `${100 - percent}%`
        trailingClip.left = `${percent}%`
      }
      let dragging = false
      const onMove = (event: PointerEvent) => {
        event.preventDefault()
        event.stopPropagation()
        if (dragging) updatePosition(event.clientX)
      }
      const onUp = (event: PointerEvent) => {
        event.preventDefault()
        event.stopPropagation()
        dragging = false
        if (divider.hasPointerCapture(event.pointerId)) divider.releasePointerCapture(event.pointerId)
      }
      const onDown = (event: PointerEvent) => {
        event.preventDefault()
        event.stopPropagation()
        dragging = true
        divider.setPointerCapture(event.pointerId)
        updatePosition(event.clientX)
      }
      divider.addEventListener('pointerdown', onDown)
      divider.addEventListener('pointermove', onMove)
      divider.addEventListener('pointerup', onUp)
      divider.addEventListener('pointercancel', onUp)
      swipePointerCleanupRef.current = () => {
        divider.removeEventListener('pointerdown', onDown)
        divider.removeEventListener('pointermove', onMove)
        divider.removeEventListener('pointerup', onUp)
        divider.removeEventListener('pointercancel', onUp)
      }
    }

    void createSwipe()
    return () => {
      cancelled = true
      removeSwipe()
    }
  }, [compareMode, activeId, comparisonImage, items, jmv, removeSwipe])

  const activeIndex = filtered.findIndex(item => item.id === activeId)
  const widgetTitle = props.config.widgetTitle?.trim() || 'Imágenes drone'
  const month = (date: Date) => date.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')
  const longDate = (date: Date) => date.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
  const clearFilters = () => { setQuery(''); setYear(''); setFrom(''); setTo('') }

  const content = () => {
    if (status === 'idle' || !props.useMapWidgetIds?.length) return <div className='drone-state'><EmptyIcon/><strong>{widgetTitle}</strong><span>{t('noMap')}</span></div>
    if (status === 'loading') return <div className='drone-state'><div className='drone-spinner'/><span>{t('loading')}</span></div>
    if (status === 'group') return <div className='drone-state'><EmptyIcon/><strong>{t('groupNotFound')}</strong><span>{t('group')}: {props.config.groupTitle || 'Automático'}</span></div>
    if (status === 'empty') return <div className='drone-state'><EmptyIcon/><strong>{t('noImages')}</strong><span>{props.config.datePattern}</span></div>

    return <div className='drone-shell'>
      <header className='drone-header'>
        <div className='drone-eyebrow'>{t('subtitle')}</div>
        <div className='drone-heading'><ImageIcon/><h2>{widgetTitle}</h2></div>
        <div className='drone-summary'><span className='drone-live'/><span>{items.length} {t('available')} · {t('group')} {detectedGroupTitle}</span></div>
      </header>

      <section className='drone-toolbar' aria-label='Filtros'>
        <div className='drone-search'>
          <SearchIcon/>
          <input aria-label={t('search')} placeholder={t('search')} value={query} onChange={e => setQuery(e.target.value)}/>
          {query && <button className='drone-clear-search' onClick={() => setQuery('')} aria-label={t('clear')}>×</button>}
        </div>
        <label className='drone-year'>
          <span>{t('year')}</span>
          <select value={year} onChange={e => setYear(e.target.value)} aria-label={t('year')}>
            <option value=''>{t('allYears')}</option>
            {years.map(availableYear => <option key={availableYear} value={availableYear}>{availableYear}</option>)}
          </select>
        </label>
        <div className='drone-range'>
          <label>{t('from')}<input type='date' value={from} max={to || undefined} onChange={e => setFrom(e.target.value)}/></label>
          <span className='drone-dash'>—</span>
          <label>{t('to')}<input type='date' value={to} min={from || undefined} onChange={e => setTo(e.target.value)}/></label>
        </div>
        <div className='drone-filter-meta'>
          <span><strong>{t('images')}:</strong> {filtered.length} {t('of')} {items.length}</span>
          {(query || year || from || to) && <button className='drone-link' onClick={clearFilters}>{t('clear')}</button>}
        </div>
      </section>

      <main className='drone-list' aria-live='polite'>
        {!filtered.length
          ? <div className='drone-state'><EmptyIcon/><span>{t('emptyFilter')}</span></div>
          : filtered.map((item, index) => {
            const active = item.id === activeId
            const comparing = compareMode && item.id === compareId && !active
            const opacity = opacityById[item.id] ?? 1
            return <div
              key={item.id}
              className={`drone-card${active ? ' is-active' : ''}${comparing ? ' is-compare' : ''}`}
            >
              <button
                className='drone-card-select'
                onClick={() => compareMode && !active ? setCompareId(item.id) : void selectPrimary(item.id)}
                title={item.title}
                aria-pressed={active || comparing}
              >
                <span className='drone-date-box'><span className='drone-day'>{item.date.getDate()}</span><span className='drone-month'>{month(item.date)}</span></span>
                <span className='drone-card-main'>
                  <span className='drone-card-title'>{longDate(item.date)}</span>
                  <span className='drone-card-sub'>
                    <span className='drone-layer-label'>{t('layer')}</span>
                    <span className='drone-layer-name'>{item.title}</span>
                  </span>
                  {(index === 0 && item.id === items[0].id) && <span className='drone-badge'>{t('latest')}</span>}
                  {active && index !== 0 && <span className='drone-badge'>{t('active')}</span>}
                  {comparing && <span className='drone-badge'>{t('compare')}</span>}
                </span>
                <span className='drone-check'><CheckIcon/></span>
              </button>
              <button
                className='drone-opacity'
                onClick={() => cycleOpacity(item)}
                title={`${t('opacity')}: ${Math.round(opacity * 100)}%`}
                aria-label={`${t('opacity')} ${item.title}: ${Math.round(opacity * 100)}%`}
              >
                <span className='drone-opacity-icon' aria-hidden='true'>◐</span>
                {Math.round(opacity * 100)}%
              </button>
            </div>
          })}
      </main>

      <footer className='drone-footer'>
        <div className='drone-nav'>
          <button disabled={activeIndex < 0 || activeIndex >= filtered.length - 1} onClick={() => void selectPrimary(filtered[activeIndex + 1]?.id)} aria-label={t('previous')}><Chevron/></button>
          <div className='drone-position'><strong>{filtered[activeIndex] ? longDate(filtered[activeIndex].date) : '—'}</strong>{t('image')} {activeIndex >= 0 ? activeIndex + 1 : 0} {t('of')} {filtered.length}</div>
          <button disabled={activeIndex <= 0} onClick={() => void selectPrimary(filtered[activeIndex - 1]?.id)} aria-label={t('next')}><Chevron right/></button>
        </div>
        <div className='drone-compare-row'>
          <div className='drone-compare-copy'><strong>{t('compare')}</strong><span>{filtered.length < 2 ? t('compareUnavailable') : t('compareHint')}</span></div>
          <button disabled={filtered.length < 2} className={`drone-toggle${compareMode ? ' on' : ''}`} onClick={() => { if (!compareMode && adjacentComparison) setCompareId(adjacentComparison.id); setCompareMode(!compareMode) }} role='switch' aria-checked={compareMode} aria-label={t('compare')}/>
        </div>
        {filtered.length >= 2 && filtered[activeIndex] && comparisonImage && <div className={`drone-compare-summary${compareMode ? ' active' : ''}`}>
          <span><small>{t('primary')}</small><strong>{longDate(filtered[activeIndex].date)}</strong></span>
          <b>↔</b>
          <span><small>{t('comparison')}</small><strong>{longDate(comparisonImage.date)}</strong></span>
        </div>}
        {compareMode && <div className='drone-swipe-status'>{t('swipeActive')}</div>}
      </footer>
    </div>
  }

  return <div className='jimu-widget' css={getStyle()}>
    {props.useMapWidgetIds?.[0] && <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds[0]} onActiveViewChange={onViewChange}/>}
    {content()}
  </div>
}

export default Widget
