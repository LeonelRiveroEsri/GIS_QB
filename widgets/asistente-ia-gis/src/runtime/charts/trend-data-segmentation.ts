import type { ChartPoint } from './chart-types'
import { resolveTemporalXValues } from './trendline-calculations'

export type TrendDataMode = 'all' | 7 | 30 | 60 | 90 | 120 | 'custom'

export interface TrendDataSegment {
  points: ChartPoint[]
  totalOriginal: number
  totalSelected: number
  effectiveStart?: Date
  effectiveEnd?: Date
  temporal: boolean
}

export const MAX_SEGMENT_DAYS = 3650
const DAY_MS = 24 * 60 * 60 * 1000

export const validateSegmentDays = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_SEGMENT_DAYS

const sortByTimestamp = (points: readonly ChartPoint[], timestamps: readonly number[]): ChartPoint[] => points
  .map((point, index) => ({ point, timestamp: timestamps[index] }))
  .sort((left, right) => left.timestamp - right.timestamp)
  .map(item => item.point)

/** Selects model inputs relative to the maximum observed timestamp without mutating source points. */
export const segmentTrendData = (points: readonly ChartPoint[], mode: TrendDataMode, customDays?: number): TrendDataSegment => {
  const timestamps = resolveTemporalXValues(points)
  const selectionTimestamps = timestamps?.map((timestamp, index) => points[index].temporalEnd ?? timestamp) || null
  const base = { totalOriginal: points.length, temporal: timestamps !== null }
  if (mode === 'all') {
    return {
      ...base,
      points: timestamps ? sortByTimestamp(points, timestamps) : [...points],
      totalSelected: points.length,
      ...(timestamps?.length ? { effectiveStart: new Date(Math.min(...timestamps)), effectiveEnd: new Date(Math.max(...timestamps)) } : {})
    }
  }
  const days = mode === 'custom' ? customDays : mode
  if (!timestamps || !selectionTimestamps || !validateSegmentDays(days)) return { ...base, points: [], totalSelected: 0 }
  const maximum = Math.max(...selectionTimestamps)
  const minimum = maximum - days * DAY_MS
  const selectedIndexes = selectionTimestamps.map((timestamp, index) => ({ timestamp, index })).filter(item => item.timestamp >= minimum && item.timestamp <= maximum)
  const selected = selectedIndexes.sort((left, right) => left.timestamp - right.timestamp).map(item => points[item.index])
  const selectedTimes = selectedIndexes.map(item => item.timestamp)
  return {
    ...base,
    points: selected,
    totalSelected: selected.length,
    ...(selectedTimes.length ? { effectiveStart: new Date(Math.min(...selectedTimes)), effectiveEnd: new Date(maximum) } : {})
  }
}