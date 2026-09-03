import type { ChartPoint } from './chart-types'
import { parseTemporalValue } from './trendline-calculations'

export type XGrouping = 'none' | 'day' | 'week' | 'month' | 'quarter' | 'year' | 'category'
export type AggregationMethod = 'average' | 'sum' | 'min' | 'max' | 'count'

export interface ChartGroupingResult {
  points: ChartPoint[]
  groupCount: number
  originalCount: number
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const formatDate = (date: Date): string => `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`

const isoWeek = (date: Date): { year: number, week: number, start: Date } => {
  const day = date.getUTCDay() || 7
  const thursday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 4 - day))
  const year = thursday.getUTCFullYear()
  const firstThursday = new Date(Date.UTC(year, 0, 4))
  const week = 1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / 86400000 - 3 + (firstThursday.getUTCDay() || 7)) / 7)
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day + 1))
  return { year, week, start }
}

const temporalGroup = (timestamp: number, grouping: Exclude<XGrouping, 'none' | 'category'>): { key: string, label: string, timestamp: number } => {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  if (grouping === 'day') {
    const start = Date.UTC(year, month, date.getUTCDate())
    return { key: `day:${start}`, label: formatDate(new Date(start)), timestamp: start }
  }
  if (grouping === 'week') {
    const value = isoWeek(date)
    return { key: `week:${value.year}:${value.week}`, label: `Sem ${value.week} · ${value.year}`, timestamp: value.start.getTime() }
  }
  if (grouping === 'month') return { key: `month:${year}:${month}`, label: `${MONTHS[month]} ${year}`, timestamp: Date.UTC(year, month, 1) }
  if (grouping === 'quarter') {
    const quarter = Math.floor(month / 3) + 1
    return { key: `quarter:${year}:${quarter}`, label: `T${quarter} ${year}`, timestamp: Date.UTC(year, (quarter - 1) * 3, 1) }
  }
  return { key: `year:${year}`, label: String(year), timestamp: Date.UTC(year, 0, 1) }
}

const aggregate = (values: readonly number[], method: AggregationMethod): number => {
  if (method === 'count') return values.length
  if (method === 'sum') return values.reduce((total, value) => total + value, 0)
  if (method === 'min') return Math.min(...values)
  if (method === 'max') return Math.max(...values)
  return values.reduce((total, value) => total + value, 0) / values.length
}

/** Groups normalized points without mutating the source artifact or source points. */
export const groupChartPoints = (
  points: readonly ChartPoint[],
  grouping: XGrouping,
  aggregationMethod: AggregationMethod
): ChartGroupingResult => {
  if (grouping === 'none') return { points: points.map(point => ({ ...point, groupCount: 1 })), groupCount: points.length, originalCount: points.length }

  const groups = new Map<string, { label: string, sourceX: string | number, order: number, values: number[], timestamps: number[] }>()
  points.forEach((point, index) => {
    let descriptor: { key: string, label: string, sourceX: string | number, order: number }
    if (grouping === 'category') {
      descriptor = { key: `category:${String(point.sourceX)}`, label: String(point.sourceX), sourceX: point.sourceX, order: index }
    } else {
      const timestamp = typeof point.sourceX === 'string' ? parseTemporalValue(point.sourceX) : undefined
      if (timestamp === undefined) return
      const temporal = temporalGroup(timestamp, grouping)
      descriptor = { key: temporal.key, label: temporal.label, sourceX: formatDate(new Date(temporal.timestamp)), order: temporal.timestamp }
    }
    const current = groups.get(descriptor.key)
    const timestamp = grouping === 'category' || typeof point.sourceX !== 'string' ? undefined : parseTemporalValue(point.sourceX)
    if (current) {
      current.values.push(point.value)
      if (timestamp !== undefined) current.timestamps.push(timestamp)
    } else groups.set(descriptor.key, { label: descriptor.label, sourceX: descriptor.sourceX, order: descriptor.order, values: [point.value], timestamps: timestamp === undefined ? [] : [timestamp] })
  })

  const grouped = Array.from(groups.entries())
    .sort((left, right) => left[1].order - right[1].order)
    .map(([groupKey, group], sourceIndex) => ({
      label: group.label,
      sourceX: group.sourceX,
      value: aggregate(group.values, aggregationMethod),
      sourceIndex,
      groupKey,
      groupCount: group.values.length,
      ...(group.timestamps.length > 0 ? { temporalStart: Math.min(...group.timestamps), temporalEnd: Math.max(...group.timestamps) } : {})
    }))
  return { points: grouped, groupCount: grouped.length, originalCount: points.length }
}
