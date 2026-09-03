import type { ChartAgentArtifact } from '../../types/agent-artifact'
import { parseTemporalValue } from './trendline-calculations'

export type ChartFieldKind = 'temporal' | 'numeric' | 'categorical' | 'unsupported'

export interface ChartFieldInfo {
  name: string
  kind: ChartFieldKind
}

export interface ChartFieldAnalysis {
  fields: ChartFieldInfo[]
  xCandidates: ChartFieldInfo[]
  yCandidates: ChartFieldInfo[]
}

const X_PRIORITY: Record<ChartFieldKind, number> = { temporal: 0, categorical: 1, numeric: 2, unsupported: 3 }

const classifyValues = (values: unknown[], rowCount: number): ChartFieldKind => {
  if (rowCount === 0) return 'unsupported'
  const threshold = Math.ceil(rowCount * 0.6)
  const temporal = values.filter(value => typeof value === 'string' && parseTemporalValue(value) !== undefined).length
  const numeric = values.filter(value => typeof value === 'number' && Number.isFinite(value)).length
  const categorical = values.filter(value => typeof value === 'string' && parseTemporalValue(value) === undefined).length
  if (temporal >= threshold) return 'temporal'
  if (numeric >= threshold) return 'numeric'
  if (categorical >= threshold) return 'categorical'
  return 'unsupported'
}

/** Classifies fields from actual row values without relying on field names. */
export const analyzeChartFields = (artifact: ChartAgentArtifact): ChartFieldAnalysis => {
  const names = Array.from(new Set(artifact.data.flatMap(row => Object.keys(row))))
  const fields = names.map(name => ({
    name,
    kind: classifyValues(artifact.data.map(row => row[name]), artifact.data.length)
  }))
  const xCandidates = fields
    .filter(field => field.kind !== 'unsupported')
    .sort((left, right) => X_PRIORITY[left.kind] - X_PRIORITY[right.kind])
  const yCandidates = fields.filter(field => field.kind === 'numeric')
  return { fields, xCandidates, yCandidates }
}

export const resolveInitialChartField = (preferred: string, candidates: readonly ChartFieldInfo[]): string => candidates.some(field => field.name === preferred)
  ? preferred
  : candidates[0]?.name || preferred

export const selectChartXCandidates = (chartType: ChartAgentArtifact['chartType'], candidates: readonly ChartFieldInfo[]): ChartFieldInfo[] => {
  if (chartType === 'scatter') {
    return candidates
      .filter(field => field.kind === 'numeric' || field.kind === 'temporal')
      .sort((left, right) => Number(left.kind === 'temporal') - Number(right.kind === 'temporal'))
  }
  if (chartType === 'donut') {
    return candidates
      .filter(field => field.kind === 'categorical' || field.kind === 'temporal')
      .sort((left, right) => Number(left.kind === 'temporal') - Number(right.kind === 'temporal'))
  }
  return [...candidates]
}