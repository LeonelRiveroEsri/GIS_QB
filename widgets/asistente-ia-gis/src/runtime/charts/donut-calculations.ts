export type DonutValueField = 'count' | string

export interface DonutSegment {
  label: string
  value: number
  percentage: number
}

export interface DonutResult {
  segments: DonutSegment[]
  total: number
}

const validCategory = (value: unknown): value is string | number => (typeof value === 'string' && value.trim().length > 0) || (typeof value === 'number' && Number.isFinite(value))

export const calculateDonut = (rows: ReadonlyArray<Record<string, unknown>>, categoryField: string, valueField: DonutValueField): DonutResult => {
  const grouped = new Map<string, number>()
  rows.forEach(row => {
    const category = row[categoryField]
    if (!validCategory(category)) return
    const contribution = valueField === 'count' ? 1 : row[valueField]
    if (typeof contribution !== 'number' || !Number.isFinite(contribution)) return
    const label = String(category)
    grouped.set(label, (grouped.get(label) || 0) + contribution)
  })
  const ordered = Array.from(grouped, ([label, value]) => ({ label, value })).sort((left, right) => right.value - left.value || left.label.localeCompare(right.label))
  if (ordered.some(item => item.value < 0)) return { segments: [], total: 0 }
  const total = ordered.reduce((sum, item) => sum + item.value, 0)
  if (!Number.isFinite(total) || total <= 0) return { segments: [], total: 0 }
  const visible = ordered.length > 8
    ? [...ordered.slice(0, 7), { label: 'Otros', value: ordered.slice(7).reduce((sum, item) => sum + item.value, 0) }]
    : ordered
  return {
    segments: visible.filter(item => item.value > 0).map(item => ({ ...item, percentage: item.value * 100 / total })),
    total
  }
}