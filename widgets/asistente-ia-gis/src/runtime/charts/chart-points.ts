import type { ChartAgentArtifact } from '../../types/agent-artifact'
import type { ChartPoint } from './chart-types'
import type { ChartFieldKind } from './chart-field-analysis'
import { parseTemporalValue } from './trendline-calculations'

const formatTemporalLabel = (timestamp: number): string => {
  const date = new Date(timestamp)
  return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`
}

/** Selects only safely displayable values from validated chart rows. */
export const normalizeChartPoints = (
  artifact: ChartAgentArtifact,
  xField = artifact.xField,
  yField = artifact.yField,
  xKind?: ChartFieldKind
): ChartPoint[] => artifact.data.flatMap(row => {
  const rawLabel = row[xField]
  const value = row[yField]
  if ((typeof rawLabel !== 'string' && typeof rawLabel !== 'number') || typeof value !== 'number' || !Number.isFinite(value)) return []
  if (xKind === 'temporal' && (typeof rawLabel !== 'string' || parseTemporalValue(rawLabel) === undefined)) return []
  if (xKind === 'numeric' && (typeof rawLabel !== 'number' || !Number.isFinite(rawLabel))) return []
  if (xKind === 'categorical' && (typeof rawLabel !== 'string' || parseTemporalValue(rawLabel) !== undefined)) return []
  const temporalValue = xKind === 'temporal' && typeof rawLabel === 'string' ? parseTemporalValue(rawLabel) : undefined
  return [{ label: temporalValue === undefined ? String(rawLabel) : formatTemporalLabel(temporalValue), sourceX: rawLabel, value }]
}).map((point, sourceIndex) => ({ ...point, sourceIndex }))