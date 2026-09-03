import { React } from 'jimu-core'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-dist-min'
import type { ChartAgentArtifact } from '../../types/agent-artifact'
import { buildPlotlyChart } from './plotly-chart-adapter'
import type { ChartPresentationModel } from './chart-presentation-model'
import type { ChartPresentationState } from './chart-presentation-state'
import { findViewportIndex, normalizeChartViewport, viewportEquals, type ChartViewportItem, type ChartViewportState } from './chart-viewport-state'

const Plot = createPlotlyComponent(Plotly)

interface Props {
  artifact: ChartAgentArtifact
  revision: number
  presentationState: ChartPresentationState
  presentationModel: ChartPresentationModel
  viewportState: ChartViewportState
  viewportItems: ChartViewportItem[]
  onViewportStateChange: (viewport: ChartViewportState | undefined) => void
}

const PlotlyChartView = ({ artifact, revision, presentationState, presentationModel, viewportState, viewportItems, onViewportStateChange }: Props) => {
  const definition = React.useMemo(() => buildPlotlyChart(artifact, presentationState, presentationModel, viewportState), [artifact, revision, presentationState, presentationModel, viewportState])
  if (!definition) return <div className='ai-plotly-empty'>No hay datos válidos para visualizar.</div>

  const handleRelayout = (event: Record<string, unknown>) => {
    if (event['xaxis.autorange'] === true) {
      if (!viewportEquals(viewportState, normalizeChartViewport(undefined, viewportItems.length))) onViewportStateChange(undefined)
      return
    }
    const startIndex = findViewportIndex(viewportItems, event['xaxis.range[0]'])
    const endIndex = findViewportIndex(viewportItems, event['xaxis.range[1]'])
    if (startIndex === undefined || endIndex === undefined) return
    const next = normalizeChartViewport({ startIndex: Math.min(startIndex, endIndex), endIndex: Math.max(startIndex, endIndex) }, viewportItems.length)
    if (!viewportEquals(viewportState, next)) onViewportStateChange(next)
  }

  return <Plot key={revision}
    data={definition.data}
    layout={{ ...definition.layout, uirevision: revision }}
    config={{ ...definition.config }}
    revision={revision}
    useResizeHandler
    style={{ width: '100%', height: '100%' }}
    onRelayout={handleRelayout}
  />
}

export default PlotlyChartView