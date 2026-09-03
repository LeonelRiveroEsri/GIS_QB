import { React } from 'jimu-core'
import type { ChartAgentArtifact } from '../../types/agent-artifact'
import AreaChart from './area-chart'
import BarChart from './bar-chart'
import type { ChartGeometry } from './chart-types'
import LineChart from './line-chart'
import DonutChart from './donut-chart'
import HistogramChart from './histogram-chart'
import ScatterChart from './scatter-chart'
import { resolveTrendXValues } from './trendline-calculations'
import { buildChartPresentationModel } from './chart-presentation-model'
import { createChartPresentationState, type ChartPresentationPatch, type ChartPresentationState } from './chart-presentation-state'
import ChartPresentationControls, { ChartPresentationStatistics } from './chart-presentation-controls'

const WIDTH = 560
const HEIGHT = 220
const PLOT = { left: 48, right: 14, top: 12, bottom: 42 }

interface Props {
  artifact: ChartAgentArtifact
  presentationState?: ChartPresentationState
  onPresentationStateChange?: (patch: ChartPresentationPatch) => void
}

const ChartRenderer = ({ artifact, presentationState: controlledPresentation, onPresentationStateChange }: Props) => {
  const presentationState = controlledPresentation || createChartPresentationState(artifact)
  const controlsEnabled = Boolean(controlledPresentation && onPresentationStateChange)
  const updatePresentation = (patch: ChartPresentationPatch) => onPresentationStateChange?.(patch)
  const model = buildChartPresentationModel(artifact, presentationState)
  const { points, trendline, projection } = model
  const values = [...points.map(point => point.value), ...(trendline?.points.map(point => point.value) || []), ...(projection?.points.map(point => point.value) || [])]
  const safeValues = values.length > 0 ? values : [0]
  const minimum = Math.min(...safeValues)
  const maximum = Math.max(...safeValues)
  const range = maximum - minimum || 1
  const plotWidth = WIDTH - PLOT.left - PLOT.right
  const plotHeight = HEIGHT - PLOT.top - PLOT.bottom
  const maximumPosition = projection?.points[projection.points.length - 1].position ?? Math.max(1, points.length - 1)
  const continuousX = artifact.chartType !== 'bar' && (model.xKind === 'temporal' || model.xKind === 'numeric')
  const resolvedXValues = continuousX ? resolveTrendXValues(points) : []
  const projectionEndPosition = projection?.points[projection.points.length - 1].position
  const projectionEndX = model.xKind === 'temporal' ? projection?.endDate.getTime() : undefined
  const visualXValues = projectionEndX === undefined ? resolvedXValues : [...resolvedXValues, projectionEndX]
  const minimumX = visualXValues.length > 0 ? Math.min(...visualXValues) : 0
  const maximumX = visualXValues.length > 0 ? Math.max(...visualXValues) : 1
  const rangeX = maximumX - minimumX || 1
  const localIndexBySourceIndex = new Map(points.map((point, index) => [point.sourceIndex ?? index, index]))
  const geometry: ChartGeometry = {
    width: WIDTH,
    height: HEIGHT,
    plotLeft: PLOT.left,
    plotRight: PLOT.right,
    plotTop: PLOT.top,
    plotBottom: PLOT.bottom,
    plotWidth,
    plotHeight,
    x: position => {
      if (!continuousX) return PLOT.left + (points.length === 1 ? plotWidth / 2 : position * plotWidth / maximumPosition)
      const localIndex = localIndexBySourceIndex.get(position) ?? position
      const value = projectionEndPosition !== undefined && position === projectionEndPosition
        ? projectionEndX
        : resolvedXValues[localIndex]
      return PLOT.left + (visualXValues.length === 1 ? plotWidth / 2 : ((value ?? minimumX) - minimumX) * plotWidth / rangeX)
    },
    ...(continuousX ? { continuousX: (value: number) => PLOT.left + (visualXValues.length === 1 ? plotWidth / 2 : (value - minimumX) * plotWidth / rangeX) } : {}),
    y: value => PLOT.top + (maximum - value) * plotHeight / range
  }
  const labelEvery = Math.max(1, Math.ceil(points.length / 6))
  const barStep = plotWidth / Math.max(1, points.length)
  if (artifact.chartType === 'histogram') {
    const histogram = model.histogram
    return <section className='ai-chart' aria-label={artifact.title}>
      <strong>{artifact.title}</strong>
      {controlsEnabled && <ChartPresentationControls artifact={artifact} presentationState={presentationState} presentationModel={model} onPresentationStateChange={updatePresentation}/>} 
      <HistogramChart result={histogram} title={artifact.title}/>
    </section>
  }

  if (artifact.chartType === 'donut') {
    const donut = model.donut
    return <section className='ai-chart' aria-label={artifact.title}>
      <strong>{artifact.title}</strong>
      {controlsEnabled && <ChartPresentationControls artifact={artifact} presentationState={presentationState} presentationModel={model} onPresentationStateChange={updatePresentation}/>} 
      <DonutChart result={donut} title={artifact.title}/>
    </section>
  }

  return <section className='ai-chart' aria-label={artifact.title}>
    <strong>{artifact.title}</strong>
    {controlsEnabled && <ChartPresentationControls artifact={artifact} presentationState={presentationState} presentationModel={model} onPresentationStateChange={updatePresentation}/>} 
    {points.length === 0
      ? <div className='ai-chart-empty'>No hay datos válidos para representar con los ejes seleccionados.</div>
      : <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role='img' aria-label={`${artifact.chartType === 'line' ? 'Gráfico de línea' : artifact.chartType === 'bar' ? 'Gráfico de barras' : artifact.chartType === 'scatter' ? 'Gráfico de dispersión' : 'Gráfico de área'}: ${artifact.title}`}>
      <line className='ai-chart-axis' x1={PLOT.left} y1={PLOT.top} x2={PLOT.left} y2={HEIGHT - PLOT.bottom}/>
      <line className='ai-chart-axis' x1={PLOT.left} y1={HEIGHT - PLOT.bottom} x2={WIDTH - PLOT.right} y2={HEIGHT - PLOT.bottom}/>
      <text className='ai-chart-value' x={PLOT.left - 6} y={PLOT.top + 4} textAnchor='end'>{maximum.toLocaleString()}</text>
      <text className='ai-chart-value' x={PLOT.left - 6} y={HEIGHT - PLOT.bottom} textAnchor='end'>{minimum.toLocaleString()}</text>
      {artifact.chartType === 'line'
        ? <LineChart points={points} geometry={geometry} trendPoints={trendline?.points} projectionPoints={projection?.points}/>
        : artifact.chartType === 'bar'
          ? <BarChart points={points} geometry={geometry}/>
          : artifact.chartType === 'scatter'
            ? <ScatterChart points={points} geometry={geometry} trendPoints={trendline?.points}/>
            : <AreaChart points={points} geometry={geometry} trendPoints={trendline?.points} projectionPoints={projection?.points}/>}
      {points.map((point, index) => (index % labelEvery === 0 || index === points.length - 1)
        ? <text
          key={`${point.label}-${index}`}
          className='ai-chart-label'
          x={artifact.chartType === 'bar' ? PLOT.left + index * barStep + barStep / 2 : geometry.x(index)}
          y={HEIGHT - 17}
          textAnchor='middle'
        >{point.label}</text>
        : null)}
      </svg>}
    {controlsEnabled && <ChartPresentationStatistics presentationState={presentationState} presentationModel={model}/>} 
  </section>
}

export default ChartRenderer