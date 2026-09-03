import type { ChartAgentArtifact } from '../../types/agent-artifact'
import { analyzeChartFields, resolveInitialChartField, selectChartXCandidates } from './chart-field-analysis'
import type { AggregationMethod, XGrouping } from './chart-grouping'
import type { HistogramBinOption } from './histogram-calculations'
import { validateProjectionDays } from './projection-calculations'
import type { MovingAverageWindow, PolynomialDegree, TrendlineMode } from './trendline-controls'
import { validateSegmentDays } from './trend-data-segmentation'

export interface ChartPresentationState {
  xField: string
  yField: string
  xGrouping: XGrouping
  aggregationMethod: AggregationMethod
  trendType: TrendlineMode
  movingAverageWindow: MovingAverageWindow
  polynomialDegree: PolynomialDegree
  segmentDays: number | null
  projectionDays: number | null
  histogramBins: HistogramBinOption
  donutMode: 'count' | 'sum'
  donutValueField?: string
}

export type ChartPresentationPatch = Partial<ChartPresentationState>

const validHistogramBins = (value: unknown): value is HistogramBinOption => value === 'auto' || value === 5 || value === 10 || value === 15 || value === 20
const validAggregationMethod = (value: unknown): value is AggregationMethod => value === 'average' || value === 'sum' || value === 'min' || value === 'max' || value === 'count'
const temporalGroupings: XGrouping[] = ['day', 'week', 'month', 'quarter', 'year']

export const createChartPresentationState = (
  artifact: ChartAgentArtifact,
  previous?: ChartPresentationState,
  previousChartType: ChartAgentArtifact['chartType'] = artifact.chartType
): ChartPresentationState => {
  const analysis = analyzeChartFields(artifact)
  const xCandidates = selectChartXCandidates(artifact.chartType, analysis.xCandidates)
  const xField = resolveInitialChartField(previous?.xField || artifact.xField, xCandidates)
  const yField = resolveInitialChartField(previous?.yField || artifact.yField, analysis.yCandidates)
  const temporalX = xCandidates.some(field => field.name === xField && field.kind === 'temporal')
  const categoricalX = xCandidates.some(field => field.name === xField && field.kind === 'categorical')
  const supportsGrouping = artifact.chartType === 'line' || artifact.chartType === 'area' || artifact.chartType === 'bar' || artifact.chartType === 'scatter'
  const requestedGrouping = previous?.xGrouping || 'none'
  const xGrouping: XGrouping = supportsGrouping && (
    (temporalX && temporalGroupings.includes(requestedGrouping)) ||
    (categoricalX && requestedGrouping === 'category')
  ) ? requestedGrouping : 'none'
  const aggregationMethod: AggregationMethod = validAggregationMethod(previous?.aggregationMethod) ? previous.aggregationMethod : 'average'
  const supportsTrends = artifact.chartType === 'line' || artifact.chartType === 'area' || artifact.chartType === 'scatter'
  const supportsMovingAverage = artifact.chartType === 'line' || artifact.chartType === 'area'
  const supportsProjection = artifact.chartType === 'line' || artifact.chartType === 'area'
  const requestedTrend = previous?.trendType || 'none'
  const trendType: TrendlineMode = !supportsTrends || (requestedTrend === 'moving-average' && !supportsMovingAverage) ? 'none' : requestedTrend
  const movingAverageWindow: MovingAverageWindow = previous?.movingAverageWindow === 5 || previous?.movingAverageWindow === 10 ? previous.movingAverageWindow : 3
  const polynomialDegree: PolynomialDegree = previous?.polynomialDegree === 3 ? 3 : 2
  const segmentDays = temporalX && trendType !== 'none' && validateSegmentDays(previous?.segmentDays) ? previous.segmentDays : null
  const projectionDays = temporalX && supportsProjection && trendType === 'linear' && validateProjectionDays(previous?.projectionDays) ? previous.projectionDays : null
  const histogramBins = artifact.chartType === 'histogram' && previousChartType === 'histogram' && validHistogramBins(previous?.histogramBins) ? previous.histogramBins : 'auto'
  const defaultDonutField = analysis.yCandidates.some(field => field.name === artifact.yField) ? artifact.yField : undefined
  const preservedDonutField = previousChartType === 'donut' && analysis.yCandidates.some(field => field.name === previous?.donutValueField) ? previous?.donutValueField : undefined
  const donutValueField = artifact.chartType === 'donut' ? preservedDonutField || defaultDonutField : undefined
  const donutMode = artifact.chartType !== 'donut' || donutValueField === undefined || (previousChartType === 'donut' && previous?.donutMode === 'count') ? 'count' : 'sum'
  return {
    xField,
    yField,
    xGrouping,
    aggregationMethod,
    trendType,
    movingAverageWindow,
    polynomialDegree,
    segmentDays,
    projectionDays,
    histogramBins,
    donutMode,
    ...(donutValueField ? { donutValueField } : {})
  }
}

export const applyChartPresentationPatch = (
  artifact: ChartAgentArtifact,
  current: ChartPresentationState,
  patch: ChartPresentationPatch
): ChartPresentationState => createChartPresentationState(artifact, { ...current, ...patch }, artifact.chartType)