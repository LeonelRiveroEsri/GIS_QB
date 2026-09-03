import type { ChartAgentArtifact } from '../../types/agent-artifact'
import type { ChartPresentationModel } from './chart-presentation-model'
import type { ChartPresentationState } from './chart-presentation-state'
import { formatProjectionDate } from './projection-calculations'
import { parseTemporalValue, resolveTrendXValues } from './trendline-calculations'
import { getChartViewportItems, normalizeChartViewport, type ChartViewportState } from './chart-viewport-state'

export interface PlotlyTrace {
  type: 'scatter' | 'bar' | 'histogram' | 'pie'
  mode?: 'lines+markers' | 'markers' | 'lines'
  x?: Array<string | number>
  y?: number[]
  labels?: string[]
  values?: number[]
  fill?: 'tozeroy'
  hole?: number
  name?: string
  hovertemplate?: string
  text?: string[]
  line?: { dash?: 'dash', color?: string }
}

export interface PlotlyChartDefinition {
  data: PlotlyTrace[]
  layout: {
    title: { text: string }
    autosize: boolean
    paper_bgcolor: string
    plot_bgcolor: string
    font: { color: string }
    margin: { left: number, right: number, top: number, bottom: number }
    xaxis?: { title: { text: string }, automargin: boolean, type?: 'date' | 'linear' | 'category', range?: Array<string | number>, nticks?: number, tickangle?: number, tickformat?: string, tickmode?: 'array', tickvals?: Array<string | number>, ticktext?: string[] }
    yaxis?: { title: { text: string }, automargin: boolean }
    legend?: { orientation: 'h' }
  }
  config: {
    responsive: true
    displaylogo: false
  }
}

const baseLayout = (artifact: ChartAgentArtifact, presentation: ChartPresentationState): PlotlyChartDefinition['layout'] => ({
  title: { text: artifact.title },
  autosize: true,
  paper_bgcolor: '#ffffff',
  plot_bgcolor: '#ffffff',
  font: { color: '#17324d' },
  margin: { left: 56, right: 20, top: 48, bottom: 54 },
  xaxis: { title: { text: presentation.xField }, automargin: true },
  yaxis: { title: { text: presentation.yField }, automargin: true }
})

export const buildPlotlyChart = (artifact: ChartAgentArtifact, presentation: ChartPresentationState, model: ChartPresentationModel, viewport?: ChartViewportState): PlotlyChartDefinition | null => {
  const viewportItems = getChartViewportItems(model)
  const normalizedViewport = normalizeChartViewport(viewport, viewportItems.length)
  const visibleItems = viewportItems.slice(normalizedViewport.startIndex, normalizedViewport.endIndex + 1)
  const categoricalRange = model.xKind === 'categorical' ? [normalizedViewport.startIndex - 0.5, normalizedViewport.endIndex + 0.5] : undefined
  const coordinateRange = model.xKind !== 'categorical' && visibleItems.length > 0 ? [visibleItems[0].value, visibleItems[visibleItems.length - 1].value] : undefined
  const axisType = model.xKind === 'temporal' ? 'date' : model.xKind === 'numeric' ? 'linear' : 'category'
  const tickEvery = Math.max(1, Math.ceil(viewportItems.length / 10))
  const groupedTicks = presentation.xGrouping !== 'none' && model.xKind === 'temporal'
    ? viewportItems.filter((_, index) => index % tickEvery === 0 || index === viewportItems.length - 1)
    : []
  const layout = {
    ...baseLayout(artifact, presentation),
    xaxis: {
      title: { text: presentation.xField },
      automargin: true,
      type: axisType,
      range: categoricalRange || coordinateRange,
      nticks: Math.min(10, Math.max(2, visibleItems.length)),
      tickangle: visibleItems.length > 8 ? -35 : 0,
      ...(groupedTicks.length > 0 ? { tickmode: 'array' as const, tickvals: groupedTicks.map(item => item.value), ticktext: groupedTicks.map(item => item.label) } : {}),
      ...(model.xKind === 'temporal' ? { tickformat: presentation.xGrouping === 'year' ? '%Y' : presentation.xGrouping === 'month' ? '%b %Y' : '%d/%m/%Y' } : {})
    }
  }
  const config: PlotlyChartDefinition['config'] = { responsive: true, displaylogo: false }
  const plotlyX = (sourceX: string | number): string | number => {
    if (model.xKind !== 'temporal' || typeof sourceX !== 'string') return sourceX
    const timestamp = parseTemporalValue(sourceX)
    return timestamp === undefined ? sourceX : new Date(timestamp).toISOString().slice(0, 10)
  }

  if (artifact.chartType === 'histogram') {
    if (model.histogram.bins.length === 0) return null
    return {
      data: [{ type: 'bar', x: model.histogram.bins.map(bin => bin.label), y: model.histogram.bins.map(bin => bin.count), name: presentation.yField, hovertemplate: `Rango: %{x}<br>Frecuencia: %{y}<extra></extra>` }],
      layout: { ...layout, xaxis: { title: { text: presentation.yField }, automargin: true }, yaxis: { title: { text: 'Frecuencia' }, automargin: true } },
      config
    }
  }

  if (artifact.chartType === 'donut') {
    const donut = model.donut
    if (donut.segments.length === 0) return null
    const { xaxis: _xaxis, yaxis: _yaxis, ...donutLayout } = layout
    return {
      data: [{
        type: 'pie',
        labels: donut.segments.map(segment => segment.label),
        values: donut.segments.map(segment => segment.value),
        hole: 0.52,
        name: model.donutValueField,
        hovertemplate: `${presentation.xField}: %{label}<br>${model.donutValueField}: %{value}<br>%{percent}<extra></extra>`
      }],
      layout: { ...donutLayout, legend: { orientation: 'h' } },
      config
    }
  }

  if (model.points.length === 0) return null
  const grouped = presentation.xGrouping !== 'none'
  const aggregationLabel = presentation.aggregationMethod === 'average' ? 'Promedio' : presentation.aggregationMethod === 'sum' ? 'Suma' : presentation.aggregationMethod === 'min' ? 'Mínimo' : presentation.aggregationMethod === 'max' ? 'Máximo' : 'Conteo'
  const common = {
    x: model.observedPoints.map(point => plotlyX(point.sourceX)),
    y: model.observedPoints.map(point => point.value),
    text: model.observedPoints.map(point => grouped ? `${point.label}<br>${aggregationLabel} ${presentation.yField}: ${point.value.toLocaleString('es-CL', { maximumFractionDigits: 4 })}<br>Registros: ${point.groupCount || 0}` : point.label),
    name: presentation.yField,
    hovertemplate: grouped ? '%{text}<extra></extra>' : model.xKind === 'temporal' ? `${presentation.xField}: %{x|%d/%m/%Y}<br>${presentation.yField}: %{y}<extra></extra>` : `${presentation.xField}: %{x}<br>${presentation.yField}: %{y}<extra></extra>`
  }
  const observed: PlotlyTrace = artifact.chartType === 'line'
    ? { type: 'scatter', mode: 'lines+markers', ...common }
    : artifact.chartType === 'bar'
      ? { type: 'bar', ...common }
      : artifact.chartType === 'scatter'
        ? { type: 'scatter', mode: 'markers', ...common }
        : { type: 'scatter', mode: 'lines', fill: 'tozeroy', ...common }
  const traces: PlotlyTrace[] = [observed]
  if (model.trendline) {
    const pointBySourceIndex = new Map(model.observedPoints.map((point, index) => [point.sourceIndex ?? index, point]))
    const trendXValues = resolveTrendXValues(model.observedPoints)
    const trendXOrder = new Map(model.observedPoints.map((point, index) => [point.sourceIndex ?? index, trendXValues[index]]))
    const trendPairs = model.trendline.points.flatMap(point => {
      const source = pointBySourceIndex.get(point.index)
      return source ? [{ x: plotlyX(source.sourceX), y: point.value, order: trendXOrder.get(point.index) ?? point.index }] : []
    })
    if (artifact.chartType === 'scatter') trendPairs.sort((left, right) => left.order - right.order)
    traces.push({
      type: 'scatter',
      mode: 'lines',
      x: trendPairs.map(point => point.x),
      y: trendPairs.map(point => point.y),
      name: presentation.trendType === 'linear' ? 'Tendencia lineal' : presentation.trendType === 'moving-average' ? `Media móvil ${presentation.movingAverageWindow}` : `Polinómica grado ${presentation.polynomialDegree}`,
      line: { dash: 'dash', color: '#0057A8' },
      hovertemplate: 'Tendencia: %{y}<extra></extra>'
    })
  }
  if (model.projection) {
    const lastModelPoint = model.segment.points[model.segment.points.length - 1]
    traces.push({
      type: 'scatter',
      mode: 'lines+markers',
      x: [model.xKind === 'temporal' && model.projection.points[0].xValue !== undefined ? new Date(model.projection.points[0].xValue).toISOString().slice(0, 10) : plotlyX(lastModelPoint.sourceX), model.xKind === 'temporal' ? model.projection.endDate.toISOString().slice(0, 10) : formatProjectionDate(model.projection.endDate)],
      y: model.projection.points.map(point => point.value),
      name: `Proyección ${model.projection.days} días`,
      line: { dash: 'dash', color: '#5D7185' },
      hovertemplate: 'Proyección: %{y}<extra></extra>'
    })
  }
  return { data: traces, layout, config }
}