import type { ChartPresentationModel } from './chart-presentation-model'
import { formatProjectionDate } from './projection-calculations'
import { parseTemporalValue } from './trendline-calculations'

export interface ChartViewportState {
  startIndex: number
  endIndex: number
}

export interface ChartViewportItem {
  label: string
  value: string | number
  comparable: number
}

const toIsoDate = (timestamp: number): string => new Date(timestamp).toISOString().slice(0, 10)

export const getChartViewportItems = (model: ChartPresentationModel): ChartViewportItem[] => {
  const items = model.observedPoints.map((point, index) => {
    if (model.xKind === 'temporal' && typeof point.sourceX === 'string') {
      const timestamp = parseTemporalValue(point.sourceX)
      if (timestamp !== undefined) return { label: point.label, value: toIsoDate(timestamp), comparable: timestamp }
    }
    if (typeof point.sourceX === 'number') return { label: point.label, value: point.sourceX, comparable: point.sourceX }
    return { label: point.label, value: point.sourceX, comparable: index }
  })
  if (model.projection) {
    const timestamp = model.projection.endDate.getTime()
    items.push({ label: formatProjectionDate(model.projection.endDate), value: toIsoDate(timestamp), comparable: timestamp })
  }
  return model.xKind === 'temporal' || model.xKind === 'numeric'
    ? items.sort((left, right) => left.comparable - right.comparable)
    : items
}

export const normalizeChartViewport = (viewport: ChartViewportState | undefined, itemCount: number): ChartViewportState => {
  const lastIndex = Math.max(0, itemCount - 1)
  if (!viewport || itemCount === 0) return { startIndex: 0, endIndex: lastIndex }
  const startIndex = Math.max(0, Math.min(lastIndex, Math.trunc(viewport.startIndex)))
  const endIndex = Math.max(startIndex, Math.min(lastIndex, Math.trunc(viewport.endIndex)))
  return { startIndex, endIndex }
}

export const viewportEquals = (left: ChartViewportState | undefined, right: ChartViewportState): boolean => left?.startIndex === right.startIndex && left.endIndex === right.endIndex

export const findViewportIndex = (items: readonly ChartViewportItem[], value: unknown): number | undefined => {
  if (items.length === 0) return undefined
  const comparable = typeof value === 'number' ? value : typeof value === 'string' ? Date.parse(value) : Number.NaN
  if (!Number.isFinite(comparable)) {
    const exact = items.findIndex(item => String(item.value) === String(value))
    return exact >= 0 ? exact : undefined
  }
  return items.reduce((best, item, index) => Math.abs(item.comparable - comparable) < Math.abs(items[best].comparable - comparable) ? index : best, 0)
}
