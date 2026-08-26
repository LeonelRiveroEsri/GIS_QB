import { React, type AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView, loadArcGISJSAPIModules } from 'jimu-arcgis'
import type { IMConfig } from '../config'
import { getStyle } from './style'

interface InsarRecord {
  key: string
  objectId: number
  layer: __esri.FeatureLayer
  graphic: __esri.Graphic
  name: string
  sector: string
  type: string
  period: string
  textDate: string
  date: Date | null
  value: number | null
  attributes: Record<string, any>
}

interface DatedImage {
  id: string
  title: string
  layer: __esri.Layer
  date: Date
}

interface SwipePlacement { layer: __esri.Layer, group: __esri.GroupLayer, index: number }

const text = (value: unknown) => value == null ? '' : String(value).trim()
const number = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}
const dateValue = (attributes: Record<string, any>) => {
  const raw = attributes.DATE ?? attributes.FECHA_INFORME ?? attributes.FECHA_PUB
  if (raw == null || raw === '') return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}
const iso = (date: Date | null) => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : ''
const unique = (records: InsarRecord[], field: 'sector' | 'type' | 'period') => [...new Set(records.map(record => record[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
const imageDate = (title: string) => {
  const match = title.match(/(\d{4})[_-](\d{2})[_-](\d{2})/)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

const MiniChart = ({ records, onSelect }: { records: InsarRecord[], onSelect: (record: InsarRecord) => void }) => {
  const points = React.useMemo(() => records.filter(record => record.value != null).slice(0, 1000), [records])
  if (points.length < 2) return <div className='insar-empty' style={{ minHeight: 115 }}>No hay suficientes puntos para construir la serie.</div>
  const values = points.map(point => point.value as number)
  const min = Math.min(0, ...values); const max = Math.max(0, ...values); const range = max - min || 1
  const width = Math.max(300, points.length * 14)
  const coords = points.map((record, index) => ({ record, x: 8 + index * ((width - 16) / (points.length - 1)), y: 108 - (((record.value as number) - min) / range) * 92 }))
  const line = coords.map(p => `${p.x},${p.y}`).join(' ')
  const zeroY = 108 - ((0 - min) / range) * 92
  const area = `8,${zeroY} ${line} ${width - 8},${zeroY}`
  const ticks = Array.from({ length: 5 }, (_, index) => {
    const value = max - (range * index / 4)
    return { value, y: 16 + (92 * index / 4) }
  })
  const formatTick = (value: number) => Math.abs(value) >= 100 ? value.toFixed(0) : Math.abs(value) >= 10 ? value.toFixed(1) : value.toFixed(2).replace(/\.00$/, '')
  return <div className='insar-chart-frame'>
    <svg className='insar-y-axis' viewBox='0 0 45 120' aria-hidden='true'>
      {ticks.map(tick => <text key={tick.y} x='38' y={tick.y + 3} textAnchor='end'>{formatTick(tick.value)}</text>)}
      <text x='5' y='12' className='insar-unit'>cm</text><line x1='44' y1='16' x2='44' y2='108'/>
    </svg>
    <div className='insar-chart-scroll'><svg className='insar-chart' width={width} viewBox={`0 0 ${width} 120`} preserveAspectRatio='none' aria-label='Deformación por registro'>
      {ticks.map(tick => <line key={tick.y} className={`insar-grid-line${Math.abs(tick.value) < range / 1000 ? ' zero' : ''}`} x1='0' y1={tick.y} x2={width} y2={tick.y}/>)}
      <line className='insar-axis zero' x1='0' y1={zeroY} x2={width} y2={zeroY}/>
      <polygon className='insar-area' points={area}/><polyline className='insar-line' points={line}/>
      {coords.map(point => <circle key={point.record.key} className='insar-dot is-action' cx={point.x} cy={point.y} r='3.2' tabIndex={0} onClick={() => onSelect(point.record)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onSelect(point.record) }}><title>{point.record.name}: {point.record.value?.toFixed(1)} cm · {point.record.sector} · {point.record.type}</title></circle>)}
    </svg></div>
  </div>
}

const SectorRanking = ({ records, onSelect }: { records: InsarRecord[], onSelect: (sector: string) => void }) => {
  const rows = React.useMemo(() => {
    const grouped = new Map<string, { maximum: number, sum: number, count: number }>()
    records.forEach(record => {
      if (!record.sector || record.value == null) return
      const current = grouped.get(record.sector) || { maximum: 0, sum: 0, count: 0 }
      current.maximum = Math.max(current.maximum, Math.abs(record.value)); current.sum += Math.abs(record.value); current.count += 1
      grouped.set(record.sector, current)
    })
    return [...grouped.entries()].map(([sector, item]) => ({ sector, maximum: item.maximum, average: item.sum / item.count, count: item.count })).sort((a, b) => b.maximum - a.maximum)
  }, [records])
  const scale = Math.max(1, ...rows.map(row => row.maximum))
  if (!rows.length) return <div className='insar-empty insar-analysis-empty'>No hay sectores con valores para comparar.</div>
  return <div className='insar-ranking'>{rows.map((row, index) => <button key={row.sector} className='insar-rank-row' onClick={() => onSelect(row.sector)}>
    <span className='insar-rank-position'>{index + 1}</span><span className='insar-rank-copy'><strong>{row.sector}</strong><span><i style={{ width: `${Math.max(3, row.maximum / scale * 100)}%` }}/></span><small>{row.count} registros · promedio abs. {row.average.toFixed(2)} cm</small></span><b>{row.maximum.toFixed(2)}<small> cm</small></b>
  </button>)}</div>
}

const TemporalHeatmap = ({ records, onSelect }: { records: InsarRecord[], onSelect: (sector: string, date: Date) => void }) => {
  const model = React.useMemo(() => {
    const sectors = [...new Set(records.map(record => record.sector).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
    const months = [...new Set(records.filter(record => record.date).map(record => `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, '0')}`))].sort()
    const cells = new Map<string, { maximum: number, count: number, date: Date }>()
    records.forEach(record => {
      if (!record.sector || !record.date || record.value == null) return
      const month = `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, '0')}`; const key = `${record.sector}\u0000${month}`; const current = cells.get(key); const value = Math.abs(record.value)
      cells.set(key, { maximum: Math.max(current?.maximum || 0, value), count: (current?.count || 0) + 1, date: record.date })
    })
    return { sectors, months, cells, maximum: Math.max(1, ...[...cells.values()].map(cell => cell.maximum)) }
  }, [records])
  if (!model.sectors.length || !model.months.length) return <div className='insar-empty insar-analysis-empty'>No hay fechas suficientes para construir el mapa de calor.</div>
  return <div className='insar-heat-scroll'><div className='insar-heatmap' style={{ gridTemplateColumns: `110px repeat(${model.months.length}, 42px)` }}>
    <div className='insar-heat-corner'>Sector / mes</div>{model.months.map(month => <div key={month} className='insar-heat-month'>{month.slice(5)}<small>{month.slice(2, 4)}</small></div>)}
    {model.sectors.map(sectorName => <React.Fragment key={sectorName}><button className='insar-heat-sector' onClick={() => onSelect(sectorName, new Date())}>{sectorName}</button>{model.months.map(month => {
      const cell = model.cells.get(`${sectorName}\u0000${month}`); const intensity = cell ? .12 + .88 * (cell.maximum / model.maximum) : 0
      return <button key={month} disabled={!cell} className='insar-heat-cell' style={cell ? { backgroundColor: `rgba(8,127,117,${intensity})`, color: intensity > .55 ? '#fff' : '#173438' } : undefined} onClick={() => cell && onSelect(sectorName, cell.date)} title={cell ? `${sectorName} · ${month}: máximo abs. ${cell.maximum.toFixed(2)} cm (${cell.count} registros)` : 'Sin datos'}>{cell ? cell.maximum.toFixed(cell.maximum >= 10 ? 0 : 1) : '·'}</button>
    })}</React.Fragment>)}
  </div></div>
}

const DeformationHistogram = ({ records, onSelect }: { records: InsarRecord[], onSelect: (record: InsarRecord) => void }) => {
  const bins = React.useMemo(() => {
    const valid = records.filter(record => record.value != null); if (!valid.length) return []
    const values = valid.map(record => record.value as number); const min = Math.min(...values); const max = Math.max(...values); const count = Math.min(12, Math.max(5, Math.ceil(Math.sqrt(valid.length)))); const size = (max - min || 1) / count
    const result = Array.from({ length: count }, (_, index) => ({ from: min + index * size, to: index === count - 1 ? max : min + (index + 1) * size, records: [] as InsarRecord[] }))
    valid.forEach(record => result[Math.min(count - 1, Math.floor(((record.value as number) - min) / size))].records.push(record)); return result
  }, [records])
  const maximum = Math.max(1, ...bins.map(bin => bin.records.length))
  if (!bins.length) return <div className='insar-empty insar-analysis-empty'>No hay valores para analizar.</div>
  return <div className='insar-histogram'>{bins.map((bin, index) => <button key={index} className='insar-hist-bin' disabled={!bin.records.length} onClick={() => bin.records[0] && onSelect(bin.records[0])} title={`${bin.from.toFixed(2)} a ${bin.to.toFixed(2)} cm · ${bin.records.length} registros`}><span>{bin.records.length}</span><i style={{ height: `${Math.max(2, bin.records.length / maximum * 100)}%` }}/><small>{bin.from.toFixed(1)}</small></button>)}</div>
}

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const [jmv, setJmv] = React.useState<JimuMapView>()
  const [records, setRecords] = React.useState<InsarRecord[]>([])
  const [images, setImages] = React.useState<DatedImage[]>([])
  const [activeImageId, setActiveImageId] = React.useState('')
  const [tab, setTab] = React.useState<'indicators' | 'analysis' | 'images'>('indicators')
  const [compareMode, setCompareMode] = React.useState(false)
  const [compareImageId, setCompareImageId] = React.useState('')
  const [opacityById, setOpacityById] = React.useState<Record<string, number>>({})
  const [sectorImageIds, setSectorImageIds] = React.useState<Set<string> | null>(null)
  const [status, setStatus] = React.useState<'map' | 'loading' | 'ready' | 'layers' | 'error'>('map')
  const [sector, setSector] = React.useState('')
  const [type, setType] = React.useState('')
  const [period, setPeriod] = React.useState('')
  const [year, setYear] = React.useState('')
  const [from, setFrom] = React.useState('')
  const [to, setTo] = React.useState('')
  const highlightRef = React.useRef<{ remove: () => void }>()
  const recordFlashTimersRef = React.useRef<number[]>([])
  const selectedGraphicRef = React.useRef<__esri.Graphic>()
  const swipePlacementsRef = React.useRef<SwipePlacement[]>([])
  const swipeClipsRef = React.useRef<Array<{ layerView: any, clip: any }>>([])
  const swipeOverlayRef = React.useRef<HTMLDivElement>()
  const swipeCleanupRef = React.useRef<() => void>()
  const aoiRequestRef = React.useRef(0)
  const sectorSpatialCacheRef = React.useRef<Map<string, { extent: __esri.Extent, imageIds: Set<string> }>>(new Map())
  const flashHandlesRef = React.useRef<Array<{ remove: () => void }>>([])
  const flashTimersRef = React.useRef<number[]>([])

  const load = React.useCallback(async (mapView: JimuMapView) => {
    const map = mapView?.view?.map
    if (!map) return
    setStatus('loading')
    try {
      const pattern = (props.config.layerTitlePattern || 'DEFORMACION').toLocaleUpperCase()
      const allLayers = map.allLayers?.toArray?.() || []
      const layers = allLayers.filter((layer: __esri.Layer) => layer.type === 'feature' && (layer.title || '').toLocaleUpperCase().includes(pattern)) as __esri.FeatureLayer[]
      if (!layers.length) { setRecords([]); setStatus('layers'); return }
      const datedImages: DatedImage[] = allLayers
        .filter((layer: __esri.Layer) => layer.type !== 'feature' && layer.type !== 'group' && Boolean(imageDate(layer.title || '')))
        .map((layer: __esri.Layer) => {
          const date = imageDate(layer.title || '')
          return date ? { id: layer.id, title: layer.title, layer, date } : null
        })
        .filter(Boolean)
        .sort((a: DatedImage, b: DatedImage) => b.date.getTime() - a.date.getTime())
      setImages(datedImages)
      const visibleImage = datedImages.find(image => image.layer.visible)
      const initialImage = visibleImage?.id || datedImages[0]?.id || ''
      setActiveImageId(initialImage)
      setCompareImageId(datedImages.find(image => image.id !== initialImage)?.id || '')
      const batches = await Promise.all(layers.map(async layer => {
        await layer.load()
        const oid = layer.objectIdField
        const objectIds = (await layer.queryObjectIds({ where: '1=1' })).sort((a, b) => Number(a) - Number(b))
        const recordLimit = Math.max(10000, Number(props.config.maxRecordsPerLayer) || 0)
        const selectedIds = objectIds.slice(0, recordLimit)
        const pageSize = Math.max(100, Math.min(1000, Number(layer.capabilities?.query?.maxRecordCount) || 1000))
        const pages: __esri.Graphic[][] = []
        for (let offset = 0; offset < selectedIds.length; offset += pageSize) {
          const result = await layer.queryFeatures({
            objectIds: selectedIds.slice(offset, offset + pageSize), outFields: ['*'], returnGeometry: true,
            outSpatialReference: mapView.view.spatialReference
          })
          pages.push(result.features)
        }
        return pages.flat().map((graphic, index): InsarRecord => {
          const a = graphic.attributes || {}; const objectId = Number(a[oid] ?? index)
          return {
            key: `${layer.id}-${objectId}`, objectId, layer, graphic,
            name: text(a.NOMBRE) || text(a.TEXT) || `Registro ${objectId}`,
            sector: text(a.SECTOR), type: text(a.TIPO) || layer.title.replace(/DEFORMACION\s*/i, '').trim(),
            period: text(a.PERIODO), textDate: text(a.TEXT), date: dateValue(a), value: number(a.DEFORMACION_CM), attributes: a
          }
        })
      }))
      sectorSpatialCacheRef.current.clear()
      setRecords(batches.flat()); setStatus('ready')
    } catch (error) {
      console.error('No fue posible consultar las capas InSAR.', error); setStatus('error')
    }
  }, [props.config.layerTitlePattern, props.config.maxRecordsPerLayer])

  React.useEffect(() => { if (jmv) void load(jmv) }, [jmv, load])
  const removeSwipe = React.useCallback(() => {
    swipeClipsRef.current.forEach(({ layerView, clip }) => layerView.clips?.remove(clip))
    swipeClipsRef.current = []
    swipeCleanupRef.current?.(); swipeCleanupRef.current = undefined
    swipeOverlayRef.current?.remove(); swipeOverlayRef.current = undefined
    if (jmv?.view?.map && swipePlacementsRef.current.length) {
      const placements = [...swipePlacementsRef.current].sort((a, b) => a.index - b.index)
      placements.forEach(({ layer }) => jmv.view.map.remove(layer))
      placements.forEach(({ layer, group, index }) => group.layers.add(layer, index))
      swipePlacementsRef.current = []
    }
  }, [jmv])
  const clearSectorFlash = React.useCallback(() => {
    flashHandlesRef.current.forEach(handle => handle.remove())
    flashHandlesRef.current = []
    flashTimersRef.current.forEach(timer => window.clearTimeout(timer))
    flashTimersRef.current = []
  }, [])
  React.useEffect(() => () => {
    highlightRef.current?.remove()
    if (selectedGraphicRef.current && jmv?.view) jmv.view.graphics.remove(selectedGraphicRef.current)
    recordFlashTimersRef.current.forEach(timer => window.clearTimeout(timer))
    clearSectorFlash()
    removeSwipe()
  }, [removeSwipe, clearSectorFlash, jmv])

  const filtered = React.useMemo(() => records.filter(record =>
    (!sector || record.sector === sector) && (!type || record.type === type) && (!period || record.period === period) &&
    (!year || (record.date && String(record.date.getFullYear()) === year)) &&
    (!from || (record.date && iso(record.date) >= from)) && (!to || (record.date && iso(record.date) <= to))
  ), [records, sector, type, period, year, from, to])
  const filteredImages = React.useMemo(() => images.filter(image =>
    (!sectorImageIds || sectorImageIds.has(image.id)) && (!year || String(image.date.getFullYear()) === year) && (!from || iso(image.date) >= from) && (!to || iso(image.date) <= to)
  ), [images, sectorImageIds, year, from, to])
  const adjacentComparison = React.useMemo(() => {
    const activeIndex = filteredImages.findIndex(image => image.id === activeImageId)
    if (activeIndex < 0) return null
    return filteredImages[activeIndex + 1] || filteredImages[activeIndex - 1] || null
  }, [filteredImages, activeImageId])
  const activeImage = React.useMemo(() => images.find(image => image.id === activeImageId), [images, activeImageId])
  const comparisonImage = React.useMemo(() => filteredImages.find(image => image.id === compareImageId) || adjacentComparison, [filteredImages, compareImageId, adjacentComparison])
  const years = React.useMemo(() => [...new Set([
    ...records.map(record => record.date?.getFullYear()),
    ...images.map(image => image.date.getFullYear())
  ].filter(Boolean))].sort((a, b) => Number(b) - Number(a)), [records, images])
  const values = filtered.map(r => r.value).filter((value): value is number => value != null)
  const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
  const maximum = values.length ? Math.max(...values.map(Math.abs)) : null
  const latest = filtered.map(r => r.date).filter((date): date is Date => Boolean(date)).sort((a, b) => b.getTime() - a.getTime())[0]

  const selectRecord = async (record: InsarRecord) => {
    if (!jmv?.view) return
    try {
      highlightRef.current?.remove()
      recordFlashTimersRef.current.forEach(timer => window.clearTimeout(timer))
      recordFlashTimersRef.current = []
      const layerView = await jmv.view.whenLayerView(record.layer) as __esri.FeatureLayerView
      highlightRef.current = layerView.highlight(record.objectId)
      if (selectedGraphicRef.current) jmv.view.graphics.remove(selectedGraphicRef.current)
      const [Graphic, SimpleFillSymbol] = await loadArcGISJSAPIModules(['esri/Graphic', 'esri/symbols/SimpleFillSymbol']) as [typeof import('esri/Graphic').default, typeof import('esri/symbols/SimpleFillSymbol').default]
      const selected = new Graphic({
        geometry: record.graphic.geometry,
        attributes: {
          ...record.attributes,
          DISPLAY_DATE: record.date ? record.date.toLocaleDateString('es-CL') : record.textDate || 'Sin fecha',
          DISPLAY_VALUE: record.value,
          DISPLAY_TYPE: record.type || 'Sin tipo'
        },
        symbol: new SimpleFillSymbol({ color: [0, 174, 239, 0.16], outline: { color: [0, 174, 239, 1], width: 3 } }),
        popupTemplate: {
          title: record.name,
          content: [{
            type: 'fields',
            fieldInfos: [
              { fieldName: 'DISPLAY_VALUE', label: 'Deformación (cm)', format: { places: 2, digitSeparator: true } },
              { fieldName: 'SECTOR', label: 'Sector' },
              { fieldName: 'DISPLAY_TYPE', label: 'Tipo de deformación' },
              { fieldName: 'PERIODO', label: 'Periodo' },
              { fieldName: 'DISPLAY_DATE', label: 'Fecha' },
              { fieldName: 'AREA_POLIGONO', label: 'Área del polígono', format: { places: 2, digitSeparator: true } },
              { fieldName: 'ORIGEN', label: 'Origen' },
              { fieldName: 'AUTOR', label: 'Autor' },
              { fieldName: 'OBSERVACION', label: 'Observación' },
              { fieldName: 'URL_SPF', label: 'Informe / recurso' }
            ]
          }]
        } as any
      })
      selectedGraphicRef.current = selected
      jmv.view.graphics.add(selected)
      if (record.graphic.geometry) await jmv.view.goTo(record.graphic.geometry.extent?.expand(2) || record.graphic.geometry, { duration: 700 })
      const popupOptions = { features: [selected], location: record.graphic.geometry?.extent?.center }
      if (typeof (jmv.view as any).openPopup === 'function') (jmv.view as any).openPopup(popupOptions)
      else (jmv.view.popup as any)?.open(popupOptions)
    } catch (error) { console.warn('No fue posible resaltar el registro.', error) }
  }
  const selectImage = (id: string) => {
    setActiveImageId(id)
  }
  const cycleOpacity = (image: DatedImage) => {
    const current = opacityById[image.id] ?? 1
    const next = current > .75 ? .75 : current > .5 ? .5 : current > .25 ? .25 : 1
    image.layer.opacity = next
    setOpacityById(previous => ({ ...previous, [image.id]: next }))
  }
  React.useEffect(() => {
    if (!images.length) return
    if (!filteredImages.some(image => image.id === activeImageId)) {
      const next = filteredImages[0]
      setActiveImageId(next?.id || '')
      images.forEach(image => { image.layer.visible = image.id === next?.id })
    }
  }, [filteredImages, activeImageId, images])
  React.useEffect(() => {
    if (filteredImages.length < 2) {
      setCompareImageId('')
      setCompareMode(false)
      return
    }
    const comparisonIsValid = filteredImages.some(image => image.id === compareImageId) && compareImageId !== activeImageId
    if (!comparisonIsValid) setCompareImageId(adjacentComparison?.id || '')
  }, [filteredImages, activeImageId, compareImageId, adjacentComparison])
  React.useEffect(() => {
    images.forEach(image => {
      image.layer.visible = image.id === activeImageId || (compareMode && image.id === comparisonImage?.id)
      image.layer.opacity = opacityById[image.id] ?? 1
    })
  }, [images, activeImageId, compareMode, comparisonImage, opacityById])

  React.useEffect(() => {
    let cancelled = false
    const createSwipe = async () => {
      removeSwipe()
      if (!compareMode || !jmv?.view) return
      const primary = images.find(image => image.id === activeImageId)
      const comparison = filteredImages.find(image => image.id === compareImageId) || adjacentComparison
      if (!primary || !comparison || primary.id === comparison.id) return
      await Promise.all([primary.layer.load(), comparison.layer.load()])
      const [ClipRect] = await loadArcGISJSAPIModules(['esri/views/layers/support/ClipRect']) as [typeof import('esri/views/layers/support/ClipRect').default]
      if (cancelled) return
      const primaryGroup = primary.layer.parent as __esri.GroupLayer
      const comparisonGroup = comparison.layer.parent as __esri.GroupLayer
      if (primaryGroup?.type !== 'group' || comparisonGroup?.type !== 'group') return
      const placements: SwipePlacement[] = [
        { layer: primary.layer, group: primaryGroup, index: primaryGroup.layers.indexOf(primary.layer) },
        { layer: comparison.layer, group: comparisonGroup, index: comparisonGroup.layers.indexOf(comparison.layer) }
      ]
      placements.forEach(({ layer, group }) => group.layers.remove(layer)); jmv.view.map.addMany([primary.layer, comparison.layer]); swipePlacementsRef.current = placements
      primary.layer.visible = true; comparison.layer.visible = true
      const [leadingView, trailingView] = await Promise.all([jmv.view.whenLayerView(primary.layer), jmv.view.whenLayerView(comparison.layer)]) as any[]
      const leadingClip = new ClipRect({ left: 0, top: 0, right: '50%', bottom: 0 }); const trailingClip = new ClipRect({ left: '50%', top: 0, right: 0, bottom: 0 })
      if (!(leadingView as any).clips || !(trailingView as any).clips) return
      ;(leadingView as any).clips.add(leadingClip); (trailingView as any).clips.add(trailingClip)
      swipeClipsRef.current = [{ layerView: leadingView, clip: leadingClip }, { layerView: trailingView, clip: trailingClip }]
      const overlay = document.createElement('div'); const divider = document.createElement('div'); const handle = document.createElement('div')
      Object.assign(overlay.style, { position: 'absolute', inset: '0', zIndex: '20', pointerEvents: 'none', overflow: 'hidden' })
      Object.assign(divider.style, { position: 'absolute', left: '50%', top: '0', bottom: '0', width: '3px', background: '#fff', borderLeft: '1px solid #29484d', cursor: 'col-resize', pointerEvents: 'auto', touchAction: 'none' })
      handle.textContent = '↔'; Object.assign(handle.style, { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '34px', height: '38px', display: 'grid', placeItems: 'center', color: '#075f59', background: '#fff', border: '1px solid #547078', borderRadius: '5px' })
      divider.appendChild(handle); overlay.appendChild(divider); (jmv.view.container as HTMLDivElement).appendChild(overlay); swipeOverlayRef.current = overlay
      let dragging = false
      const move = (event: PointerEvent) => { if (!dragging) return; const bounds = (jmv.view.container as HTMLDivElement).getBoundingClientRect(); const percent = Math.max(2, Math.min(98, ((event.clientX - bounds.left) / bounds.width) * 100)); divider.style.left = `${percent}%`; leadingClip.right = `${100 - percent}%`; trailingClip.left = `${percent}%` }
      const down = (event: PointerEvent) => { event.preventDefault(); dragging = true; divider.setPointerCapture(event.pointerId); move(event) }
      const up = (event: PointerEvent) => { dragging = false; if (divider.hasPointerCapture(event.pointerId)) divider.releasePointerCapture(event.pointerId) }
      divider.addEventListener('pointerdown', down); divider.addEventListener('pointermove', move); divider.addEventListener('pointerup', up); divider.addEventListener('pointercancel', up)
      swipeCleanupRef.current = () => { divider.removeEventListener('pointerdown', down); divider.removeEventListener('pointermove', move); divider.removeEventListener('pointerup', up); divider.removeEventListener('pointercancel', up) }
    }
    void createSwipe().catch(error => console.warn('No fue posible activar la comparación Swipe.', error))
    return () => { cancelled = true; removeSwipe() }
  }, [compareMode, activeImageId, compareImageId, images, filteredImages, adjacentComparison, jmv, removeSwipe])

  const flashSector = React.useCallback(async (sectorName: string) => {
    clearSectorFlash()
    if (!sectorName || !jmv?.view) return
    const byLayer = new Map<__esri.FeatureLayer, number[]>()
    records.filter(record => record.sector === sectorName).forEach(record => {
      byLayer.set(record.layer, [...(byLayer.get(record.layer) || []), record.objectId])
    })
    const layerViews = await Promise.all([...byLayer.entries()].map(async ([layer, objectIds]) => ({
      layerView: await jmv.view.whenLayerView(layer) as __esri.FeatureLayerView,
      objectIds
    })))
    const show = () => {
      flashHandlesRef.current = layerViews.map(({ layerView, objectIds }) => layerView.highlight(objectIds))
    }
    const hide = () => {
      flashHandlesRef.current.forEach(handle => handle.remove())
      flashHandlesRef.current = []
    }
    show()
    flashTimersRef.current.push(window.setTimeout(hide, 380))
    flashTimersRef.current.push(window.setTimeout(show, 650))
    flashTimersRef.current.push(window.setTimeout(hide, 1030))
    flashTimersRef.current.push(window.setTimeout(show, 1300))
    flashTimersRef.current.push(window.setTimeout(hide, 1900))
  }, [records, jmv, clearSectorFlash])

  React.useEffect(() => {
    const requestId = ++aoiRequestRef.current
    const applySectorAoi = async () => {
      if (!sector || !jmv?.view) { setSectorImageIds(null); return }
      const cached = sectorSpatialCacheRef.current.get(sector)
      if (cached) {
        setSectorImageIds(new Set(cached.imageIds))
        await jmv.view.goTo(cached.extent.expand(1.15), { duration: 500, easing: 'ease-in-out' })
        if (requestId === aoiRequestRef.current) await flashSector(sector)
        return
      }
      const geometries = records.filter(record => record.sector === sector && record.graphic.geometry).map(record => record.graphic.geometry)
      if (!geometries.length) { setSectorImageIds(new Set()); return }
      const extents = geometries.map(geometry => geometry.extent).filter(Boolean)
      if (!extents.length) { setSectorImageIds(new Set()); return }
      const sectorExtent = extents.slice(1).reduce((combined, extent) => combined.union(extent), extents[0].clone())
      if (requestId !== aoiRequestRef.current) return
      await jmv.view.goTo(sectorExtent.expand(1.15), { duration: 650, easing: 'ease-in-out' })
      if (requestId === aoiRequestRef.current) await flashSector(sector)
      const matches = await Promise.all(images.map(async image => {
        try {
          await image.layer.load()
          const extent = image.layer.fullExtent
          if (!extent) return null
          if (extent.spatialReference?.wkid === sectorExtent.spatialReference?.wkid || extent.spatialReference?.isWebMercator === sectorExtent.spatialReference?.isWebMercator) {
            return extent.intersects(sectorExtent) ? image.id : null
          }
          const [projection] = await loadArcGISJSAPIModules(['esri/geometry/projection']) as [typeof import('esri/geometry/projection')]
          await projection.load()
          const projected = projection.project(extent, sectorExtent.spatialReference) as __esri.Extent
          return projected?.intersects(sectorExtent) ? image.id : null
        } catch { return null }
      }))
      if (requestId !== aoiRequestRef.current) return
      const imageIds = new Set(matches.filter(Boolean) as string[])
      sectorSpatialCacheRef.current.set(sector, { extent: sectorExtent.clone(), imageIds })
      setSectorImageIds(new Set(imageIds))
    }
    void applySectorAoi().catch(error => console.warn('No fue posible aplicar el AOI del sector.', error))
    return () => { ++aoiRequestRef.current }
  }, [sector, records, images, jmv, flashSector])
  const clear = () => { setSector(''); setType(''); setPeriod(''); setYear(''); setFrom(''); setTo('') }

  return <div css={getStyle()} className='insar-shell'>
    {props.useMapWidgetIds?.[0] && <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds[0]} onActiveViewChange={setJmv}/>} 
    <header className='insar-header'><div className='insar-eyebrow'>Control geotécnico</div><h2 className='insar-title'>{props.config.widgetTitle || 'Monitoreo InSAR'}</h2><div className='insar-source'>Deformación vertical · horizontal · total</div></header>
    {status === 'ready' && <>
      <section className='insar-filters'>
        <div className='insar-grid'>
          <div className='insar-field'><label>Sector</label><select value={sector} onChange={e => setSector(e.target.value)}><option value=''>Todos</option>{unique(records, 'sector').map(v => <option key={v}>{v}</option>)}</select></div>
          <div className='insar-field'><label>Tipo</label><select value={type} onChange={e => setType(e.target.value)}><option value=''>Todos</option>{unique(records, 'type').map(v => <option key={v}>{v}</option>)}</select></div>
          <div className='insar-field'><label>Periodo</label><select value={period} onChange={e => setPeriod(e.target.value)}><option value=''>Todos</option>{unique(records, 'period').map(v => <option key={v}>{v}</option>)}</select></div>
          <div className='insar-field'><label>Año · datos e imágenes</label><select value={year} onChange={e => setYear(e.target.value)}><option value=''>Todos</option>{years.map(v => <option key={v} value={String(v)}>{v}</option>)}</select></div>
          <div className='insar-field'><label>Desde</label><input type='date' value={from} onChange={e => setFrom(e.target.value)}/></div>
          <div className='insar-field'><label>Hasta</label><input type='date' value={to} onChange={e => setTo(e.target.value)}/></div>
        </div>
        <div className='insar-actions'><button className='insar-clear' onClick={clear}>Limpiar filtros</button><span className='insar-count'>{filtered.length} registros · {filteredImages.length} imágenes</span></div>
      </section>
      <nav className='insar-tabs'><button className={tab === 'indicators' ? 'active' : ''} onClick={() => setTab('indicators')}>Indicadores</button><button className={tab === 'analysis' ? 'active' : ''} onClick={() => setTab('analysis')}>Análisis</button><button className={tab === 'images' ? 'active' : ''} onClick={() => setTab('images')}>Imágenes <span>{filteredImages.length}</span></button></nav>
      {tab === 'indicators' && <main className='insar-content'>
        <div className='insar-kpis'>
          <div className='insar-kpi'><span>Promedio</span><strong>{average == null ? '—' : average.toFixed(2)}</strong><small>cm</small></div>
          <div className='insar-kpi'><span>Máximo abs.</span><strong>{maximum == null ? '—' : maximum.toFixed(2)}</strong><small>cm</small></div>
          <div className='insar-kpi'><span>Última fecha</span><strong style={{ fontSize: 12 }}>{latest ? latest.toLocaleDateString('es-CL') : '—'}</strong><small>{new Set(filtered.map(r => r.sector).filter(Boolean)).size} sectores</small></div>
        </div>
        <section className='insar-panel'><div className='insar-panel-head'><h3>Deformación por punto evaluado</h3><span>{Math.min(filtered.length, 1000)} puntos · clic para ubicar</span></div><MiniChart records={filtered} onSelect={record => void selectRecord(record)}/></section>
        <section className='insar-panel'><div className='insar-panel-head'><h3>Resultados</h3><span>Seleccione para ubicar</span></div>
          <div className='insar-list'>{filtered.slice(0, 100).map(record => <button className='insar-row' key={record.key} onClick={() => void selectRecord(record)}>
            <span><strong>{record.name}</strong><span className='insar-row-meta'>{record.sector || 'Sin sector'} · {record.date ? record.date.toLocaleDateString('es-CL') : record.textDate || 'Sin fecha'}</span></span>
            <span className='insar-value'>{record.value == null ? '—' : `${record.value.toFixed(2)} cm`}<span className='insar-type'>{record.type}</span></span>
          </button>)}</div>
          {!filtered.length && <div className='insar-empty' style={{ minHeight: 120 }}>No hay resultados para los filtros seleccionados.</div>}
        </section>
      </main>}
      {tab === 'analysis' && <main className='insar-content insar-analysis'>
        <section className='insar-panel'><div className='insar-panel-head'><h3>Ranking de sectores</h3><span>Máximo absoluto · clic para filtrar</span></div><SectorRanking records={filtered} onSelect={value => setSector(value)}/></section>
        <section className='insar-panel'><div className='insar-panel-head'><h3>Intensidad sector–tiempo</h3><span>Máximo absoluto por mes</span></div><TemporalHeatmap records={filtered} onSelect={(value, date) => { setSector(value); setYear(String(date.getFullYear())); setFrom(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`); setTo(iso(new Date(date.getFullYear(), date.getMonth() + 1, 0))) }}/></section>
        <section className='insar-panel'><div className='insar-panel-head'><h3>Distribución de deformaciones</h3><span>Frecuencia por rango · clic para ubicar</span></div><DeformationHistogram records={filtered} onSelect={record => void selectRecord(record)}/></section>
      </main>}
      {tab === 'images' && <main className='insar-images'>
        <div className='insar-image-list'>{filteredImages.map((image, index) => {
          const active = image.id === activeImageId; const comparing = compareMode && image.id === compareImageId && !active; const opacity = opacityById[image.id] ?? 1
          return <div key={image.id} className={`insar-image-card${active ? ' active' : ''}${comparing ? ' compare' : ''}`}>
            <button className='insar-image-select' onClick={() => compareMode && !active ? setCompareImageId(image.id) : selectImage(image.id)}>
              <span className='insar-date-box'><strong>{image.date.getDate()}</strong><small>{image.date.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')}</small></span>
              <span className='insar-image-copy'><strong>{image.date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</strong><small>CAPA · {image.title}</small>{index === 0 && <em>MÁS RECIENTE</em>}{comparing && <em>COMPARACIÓN</em>}</span>
              <span className='insar-check'>{active || comparing ? '✓' : ''}</span>
            </button>
            <button className='insar-opacity' onClick={() => cycleOpacity(image)}>◐ {Math.round(opacity * 100)}%</button>
          </div>
        })}{!filteredImages.length && <div className='insar-empty'>No hay imágenes para el periodo seleccionado.</div>}</div>
        <div className='insar-image-footer'>
          <div className='insar-image-nav'><button disabled={filteredImages.findIndex(i => i.id === activeImageId) >= filteredImages.length - 1} onClick={() => selectImage(filteredImages[filteredImages.findIndex(i => i.id === activeImageId) + 1]?.id)}>‹</button><span><strong>{images.find(i => i.id === activeImageId)?.date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) || '—'}</strong>Imagen {Math.max(0, filteredImages.findIndex(i => i.id === activeImageId)) + 1} de {filteredImages.length}</span><button disabled={filteredImages.findIndex(i => i.id === activeImageId) <= 0} onClick={() => selectImage(filteredImages[filteredImages.findIndex(i => i.id === activeImageId) - 1]?.id)}>›</button></div>
          <div className='insar-compare-row'><span><strong>Comparar imágenes filtradas</strong><small>{filteredImages.length < 2 ? 'Se necesitan al menos dos imágenes dentro del filtro.' : 'Al activar se utiliza automáticamente la fecha anterior disponible.'}</small></span><button disabled={filteredImages.length < 2} className={`insar-toggle${compareMode ? ' on' : ''}`} onClick={() => { if (!compareMode && adjacentComparison) setCompareImageId(adjacentComparison.id); setCompareMode(!compareMode) }} aria-label={compareMode ? 'Desactivar comparación' : 'Activar comparación'}><i/></button></div>
          {filteredImages.length >= 2 && activeImage && (comparisonImage || adjacentComparison) && <div className={`insar-compare-summary${compareMode ? ' active' : ''}`}>
            <span><small>Principal</small><strong>{activeImage.date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span><b>↔</b><span><small>Comparación</small><strong>{(comparisonImage || adjacentComparison).date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
          </div>}
          {compareMode && <div className='insar-swipe-state'>Comparación Swipe activa · puede elegir otra tarjeta dentro del filtro</div>}
        </div>
      </main>}
    </>}
    {status !== 'ready' && <div className='insar-empty'>{status === 'loading' && <div className='insar-spinner'/>}<strong>{status === 'map' ? 'Configure el widget de mapa' : status === 'loading' ? 'Cargando información InSAR' : status === 'layers' ? 'No se encontraron capas de deformación' : 'No fue posible cargar los datos'}</strong><span>{status === 'layers' ? 'Revise que el Web Map contenga las capas vertical, horizontal y total.' : status === 'error' ? 'Compruebe el acceso a las capas y vuelva a intentar.' : ''}</span></div>}
  </div>
}

export default Widget
