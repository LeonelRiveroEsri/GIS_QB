import type { ChartPoint, TrendPoint } from './chart-types'

export interface TrendlineResult {
  points: TrendPoint[]
  rSquared?: number
  slope?: number
  intercept?: number
}

const finitePoints = (points: readonly ChartPoint[]): boolean => points.every(point => Number.isFinite(point.value))

export const parseTemporalValue = (value: string): number | undefined => {
  const localDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (localDate) {
    const timestamp = Date.UTC(Number(localDate[3]), Number(localDate[2]) - 1, Number(localDate[1]))
    const date = new Date(timestamp)
    if (date.getUTCFullYear() === Number(localDate[3]) && date.getUTCMonth() === Number(localDate[2]) - 1 && date.getUTCDate() === Number(localDate[1])) return timestamp
    return undefined
  }
  if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return undefined
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : undefined
}

export const resolveTemporalXValues = (points: readonly ChartPoint[]): number[] | null => {
  if (!points.every(point => typeof point.sourceX === 'string')) return null
  const dates = points.map(point => parseTemporalValue(point.sourceX as string))
  return dates.every((value): value is number => value !== undefined) ? dates : null
}

/** Uses numeric X, then a consistent date scale, otherwise ordered indices. */
export const resolveTrendXValues = (points: readonly ChartPoint[]): number[] => {
  if (points.every(point => typeof point.sourceX === 'number' && Number.isFinite(point.sourceX))) return points.map(point => point.sourceX as number)
  const dates = resolveTemporalXValues(points)
  if (dates) return dates
  return points.map((_, index) => index)
}

const coefficientOfDetermination = (actual: readonly number[], predicted: readonly number[]): number | undefined => {
  if (actual.length !== predicted.length || actual.length === 0 || !predicted.every(Number.isFinite)) return undefined
  const mean = actual.reduce((sum, value) => sum + value, 0) / actual.length
  const total = actual.reduce((sum, value) => sum + (value - mean) ** 2, 0)
  const residual = actual.reduce((sum, value, index) => sum + (value - predicted[index]) ** 2, 0)
  if (!Number.isFinite(total) || !Number.isFinite(residual)) return undefined
  if (total === 0) return residual === 0 ? 1 : 0
  return 1 - residual / total
}

export const calculateLinearTrend = (points: readonly ChartPoint[]): TrendlineResult | null => {
  if (points.length < 2 || !finitePoints(points)) return null
  const xValues = resolveTrendXValues(points)
  const xMean = xValues.reduce((sum, value) => sum + value, 0) / xValues.length
  const yMean = points.reduce((sum, point) => sum + point.value, 0) / points.length
  const denominator = xValues.reduce((sum, value) => sum + (value - xMean) ** 2, 0)
  if (!Number.isFinite(denominator) || denominator === 0) return null
  const numerator = points.reduce((sum, point, index) => sum + (xValues[index] - xMean) * (point.value - yMean), 0)
  const slope = numerator / denominator
  const intercept = yMean - slope * xMean
  const predicted = xValues.map(value => slope * value + intercept)
  if (![slope, intercept, ...predicted].every(Number.isFinite)) return null
  return {
    points: predicted.map((value, index) => ({ index: points[index].sourceIndex ?? index, value })),
    slope,
    intercept,
    rSquared: coefficientOfDetermination(points.map(point => point.value), predicted)
  }
}

export const calculateMovingAverage = (points: readonly ChartPoint[], windowSize: number): TrendlineResult | null => {
  if (!Number.isInteger(windowSize) || windowSize < 1 || points.length < windowSize || !finitePoints(points)) return null
  const result: TrendPoint[] = []
  for (let index = windowSize - 1; index < points.length; index++) {
    let sum = 0
    for (let offset = 0; offset < windowSize; offset++) sum += points[index - offset].value
    const value = sum / windowSize
    if (!Number.isFinite(value)) return null
    result.push({ index: points[index].sourceIndex ?? index, value })
  }
  return { points: result }
}

const solveLinearSystem = (matrix: number[][], vector: number[]): number[] | null => {
  const size = vector.length
  const augmented = matrix.map((row, index) => [...row, vector[index]])
  for (let column = 0; column < size; column++) {
    let pivot = column
    for (let row = column + 1; row < size; row++) if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row
    if (!Number.isFinite(augmented[pivot][column]) || Math.abs(augmented[pivot][column]) < 1e-12) return null
    ;[augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]]
    const divisor = augmented[column][column]
    for (let item = column; item <= size; item++) augmented[column][item] /= divisor
    for (let row = 0; row < size; row++) {
      if (row === column) continue
      const factor = augmented[row][column]
      for (let item = column; item <= size; item++) augmented[row][item] -= factor * augmented[column][item]
    }
  }
  const solution = augmented.map(row => row[size])
  return solution.every(Number.isFinite) ? solution : null
}

export const calculatePolynomialTrend = (points: readonly ChartPoint[], degree: 2 | 3): TrendlineResult | null => {
  if (points.length < degree + 1 || !finitePoints(points)) return null
  const rawX = resolveTrendXValues(points)
  const mean = rawX.reduce((sum, value) => sum + value, 0) / rawX.length
  const scale = Math.max(...rawX.map(value => Math.abs(value - mean)))
  if (!Number.isFinite(scale) || scale === 0) return null
  const xValues = rawX.map(value => (value - mean) / scale)
  const size = degree + 1
  const matrix = Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, column) => xValues.reduce((sum, value) => sum + value ** (row + column), 0)))
  const vector = Array.from({ length: size }, (_, power) => points.reduce((sum, point, index) => sum + point.value * xValues[index] ** power, 0))
  const coefficients = solveLinearSystem(matrix, vector)
  if (!coefficients) return null
  const predicted = xValues.map(value => coefficients.reduce((sum, coefficient, power) => sum + coefficient * value ** power, 0))
  if (!predicted.every(Number.isFinite)) return null
  return {
    points: predicted.map((value, index) => ({ index: points[index].sourceIndex ?? index, value })),
    rSquared: coefficientOfDetermination(points.map(point => point.value), predicted)
  }
}