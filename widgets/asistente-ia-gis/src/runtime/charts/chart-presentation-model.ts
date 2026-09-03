import type { ChartAgentArtifact } from '../../types/agent-artifact'
import { analyzeChartFields, selectChartXCandidates, type ChartFieldKind } from './chart-field-analysis'
import { calculateDonut, type DonutResult, type DonutValueField } from './donut-calculations'
import { calculateHistogram, extractFiniteValues, type HistogramResult } from './histogram-calculations'
import { groupChartPoints, type ChartGroupingResult } from './chart-grouping'
import { normalizeChartPoints } from './chart-points'
import type { ChartPoint, LinearProjection } from './chart-types'
import type { ChartPresentationState } from './chart-presentation-state'
import { calculateLinearProjection } from './projection-calculations'
import { segmentTrendData, type TrendDataSegment } from './trend-data-segmentation'
import { calculateLinearTrend, calculateMovingAverage, calculatePolynomialTrend, type TrendlineResult } from './trendline-calculations'

export interface ChartPresentationModel {
  observedPoints: ChartPoint[]
  points: ChartPoint[]
  grouping: ChartGroupingResult
  xKind?: ChartFieldKind
  segment: TrendDataSegment
  trendline: TrendlineResult | null
  projection: LinearProjection | null
  histogram: HistogramResult
  donut: DonutResult
  temporalAxisValid: boolean
  donutValueField: DonutValueField
  statistics: {
    model: ChartPresentationState['trendType']
    segmentDays: number | null
    selectedCount: number
    analyzedCount: number
    originalCount: number
    groupCount: number
    rSquared?: number
    slope?: number
  }
}

export const buildChartPresentationModel = (
  artifact: ChartAgentArtifact,
  presentation: ChartPresentationState
): ChartPresentationModel => {
  const analysis = analyzeChartFields(artifact)
  const xCandidates = selectChartXCandidates(artifact.chartType, analysis.xCandidates)
  const xKind = xCandidates.find(field => field.name === presentation.xField)?.kind
  const normalizedPoints = normalizeChartPoints(artifact, presentation.xField, presentation.yField, xKind)
  const grouping = groupChartPoints(normalizedPoints, presentation.xGrouping, presentation.aggregationMethod)
  const points = grouping.points
  const segment = segmentTrendData(points, presentation.segmentDays === null ? 'all' : 'custom', presentation.segmentDays ?? undefined)
  const modelPoints = segment.points
  let trendline: TrendlineResult | null = null
  if (presentation.trendType === 'linear') trendline = calculateLinearTrend(modelPoints)
  if (presentation.trendType === 'moving-average') trendline = calculateMovingAverage(modelPoints, presentation.movingAverageWindow)
  if (presentation.trendType === 'polynomial') trendline = calculatePolynomialTrend(modelPoints, presentation.polynomialDegree)
  const projection = presentation.trendType === 'linear' && presentation.projectionDays !== null
    ? calculateLinearProjection(modelPoints, trendline, presentation.projectionDays)
    : null
  const donutValueField: DonutValueField = presentation.donutMode === 'count' ? 'count' : presentation.donutValueField || presentation.yField
  return {
    observedPoints: points,
    points,
    grouping,
    xKind,
    segment,
    trendline,
    projection,
    histogram: calculateHistogram(extractFiniteValues(artifact.data, presentation.yField), presentation.histogramBins),
    donut: calculateDonut(artifact.data, presentation.xField, donutValueField),
    temporalAxisValid: segment.temporal,
    donutValueField,
    statistics: {
      model: presentation.trendType,
      segmentDays: presentation.segmentDays,
      selectedCount: segment.totalSelected,
      analyzedCount: segment.totalOriginal,
      originalCount: grouping.originalCount,
      groupCount: grouping.groupCount,
      ...(trendline?.rSquared !== undefined ? { rSquared: trendline.rSquared } : {}),
      ...(trendline?.slope !== undefined ? { slope: trendline.slope } : {})
    }
  }
}