export type HistogramBinOption = 'auto' | 5 | 10 | 15 | 20

export interface HistogramBin {
  minimum: number
  maximum: number
  count: number
  label: string
}

export interface HistogramResult {
  bins: HistogramBin[]
  total: number
}

const formatBoundary = (value: number): string => value.toLocaleString(undefined, { maximumSignificantDigits: 5 })

export const extractFiniteValues = (rows: ReadonlyArray<Record<string, unknown>>, field: string): number[] => rows.flatMap(row => {
  const value = row[field]
  return typeof value === 'number' && Number.isFinite(value) ? [value] : []
})

export const calculateHistogram = (values: readonly unknown[], option: HistogramBinOption = 'auto'): HistogramResult => {
  const finiteValues = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (finiteValues.length === 0) return { bins: [], total: 0 }
  const minimum = Math.min(...finiteValues)
  const maximum = Math.max(...finiteValues)
  if (minimum === maximum) {
    return { bins: [{ minimum, maximum, count: finiteValues.length, label: formatBoundary(minimum) }], total: finiteValues.length }
  }
  const binCount = option === 'auto' ? Math.min(20, Math.max(3, Math.ceil(Math.sqrt(finiteValues.length)))) : option
  const width = (maximum - minimum) / binCount
  const counts = Array.from({ length: binCount }, () => 0)
  finiteValues.forEach(value => {
    const index = Math.min(binCount - 1, Math.floor((value - minimum) / width))
    counts[index]++
  })
  return {
    bins: counts.map((count, index) => {
      const lower = minimum + index * width
      const upper = index === binCount - 1 ? maximum : minimum + (index + 1) * width
      return { minimum: lower, maximum: upper, count, label: `${formatBoundary(lower)}–${formatBoundary(upper)}` }
    }),
    total: finiteValues.length
  }
}