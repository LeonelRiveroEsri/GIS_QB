import type { ChartPoint, LinearProjection } from './chart-types'
import { resolveTemporalXValues, type TrendlineResult } from './trendline-calculations'

export const MAX_PROJECTION_DAYS = 3650
const DAY_MS = 24 * 60 * 60 * 1000

export const validateProjectionDays = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_PROJECTION_DAYS

/** Extends an existing temporal linear model using only two visual endpoints. */
export const calculateLinearProjection = (
  points: readonly ChartPoint[],
  linearModel: TrendlineResult | null,
  days: number
): LinearProjection | null => {
  if (!validateProjectionDays(days) || points.length < 2 || linearModel?.slope === undefined || linearModel.intercept === undefined) return null
  const timestamps = resolveTemporalXValues(points)
  if (!timestamps || !timestamps.every(Number.isFinite)) return null
  const projectionTimestamps = timestamps.map((timestamp, index) => points[index].temporalEnd ?? timestamp)
  const firstTimestamp = points[0].temporalStart ?? projectionTimestamps[0]
  const lastTimestamp = projectionTimestamps[projectionTimestamps.length - 1]
  if (timestamps.some((timestamp, index) => index > 0 && timestamp <= timestamps[index - 1])) return null
  const observedDuration = lastTimestamp - firstTimestamp
  if (observedDuration <= 0) return null
  const futureTimestamp = lastTimestamp + days * DAY_MS
  const startValue = linearModel.slope * lastTimestamp + linearModel.intercept
  const estimatedValue = linearModel.slope * futureTimestamp + linearModel.intercept
  const firstPosition = points[0].sourceIndex ?? 0
  const lastPosition = points[points.length - 1].sourceIndex ?? points.length - 1
  const positions = points.map((point, index) => point.sourceIndex ?? index)
  const minimumPosition = Math.min(...positions)
  const maximumPosition = Math.max(...positions)
  const positionSpan = maximumPosition - minimumPosition
  if (positionSpan <= 0) return null
  const endPosition = maximumPosition + (futureTimestamp - lastTimestamp) * positionSpan / observedDuration
  if (![futureTimestamp, startValue, estimatedValue, endPosition].every(Number.isFinite)) return null
  return {
    days,
    endDate: new Date(futureTimestamp),
    estimatedValue,
    points: [
      { position: lastPosition, value: startValue, xValue: lastTimestamp },
      { position: endPosition, value: estimatedValue, xValue: futureTimestamp }
    ]
  }
}

export const slopePerDay = (linearModel: TrendlineResult | null): number | undefined => {
  if (linearModel?.slope === undefined) return undefined
  const value = linearModel.slope * DAY_MS
  return Number.isFinite(value) ? value : undefined
}

export const formatProjectionDate = (date: Date): string => {
  if (!Number.isFinite(date.getTime())) return ''
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${date.getUTCFullYear()}`
}