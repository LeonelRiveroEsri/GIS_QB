import { React } from 'jimu-core'
import type { ChartAgentArtifact } from '../../types/agent-artifact'
import type { ChartPresentationState } from './chart-presentation-state'
import type { ChartPresentationPatch } from './chart-presentation-state'
import { buildChartPresentationModel } from './chart-presentation-model'
import ChartPresentationControls, { ChartPresentationStatistics } from './chart-presentation-controls'
import ChartRangeControl from './chart-range-control'
import { getChartViewportItems, normalizeChartViewport, viewportEquals, type ChartViewportState } from './chart-viewport-state'

const PlotlyChartView = React.lazy(async () => import('./plotly-chart-view'))

interface Props {
  panelId: string
  tabId: string
  latestChartArtifact?: ChartAgentArtifact
  chartRevision: number
  presentationState?: ChartPresentationState
  viewportState?: ChartViewportState
  onPresentationStateChange: (patch: ChartPresentationPatch) => void
  onViewportStateChange: (viewport: ChartViewportState | undefined) => void
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

class PlotlyErrorBoundary extends React.PureComponent<ErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError () {
    return { failed: true }
  }

  render () {
    return this.state.failed
      ? <div className='ai-plotly-empty' role='status'>No fue posible representar este gráfico.</div>
      : this.props.children
  }
}

const ChartWorkspace = ({ panelId, tabId, latestChartArtifact, chartRevision, presentationState, viewportState, onPresentationStateChange, onViewportStateChange }: Props) => {
  const presentationModel = React.useMemo(() => latestChartArtifact && presentationState
    ? buildChartPresentationModel(latestChartArtifact, presentationState)
    : undefined, [latestChartArtifact, presentationState])
  const viewportItems = React.useMemo(() => presentationModel ? getChartViewportItems(presentationModel) : [], [presentationModel])
  const normalizedViewport = normalizeChartViewport(viewportState, viewportItems.length)
  React.useEffect(() => {
    if (viewportItems.length > 0 && !viewportEquals(viewportState, normalizedViewport)) onViewportStateChange(normalizedViewport)
  }, [viewportItems.length, normalizedViewport.startIndex, normalizedViewport.endIndex, viewportState, onViewportStateChange])

  return <main id={panelId} className='ai-chart-workspace' role='tabpanel' aria-labelledby={tabId}>
  <header>
    <div>
      <h3>Gráficos</h3>
      <p>Los gráficos generados durante la conversación aparecerán en este espacio.</p>
    </div>
    <span className='ai-chart-local-mode'>Modo local</span>
  </header>
  {!latestChartArtifact || !presentationState || !presentationModel
    ? <div className='ai-plotly-empty'><span>Solicite un gráfico desde el chat para visualizarlo aquí.</span></div>
    : <>
  <ChartPresentationControls artifact={latestChartArtifact} presentationState={presentationState} presentationModel={presentationModel} onPresentationStateChange={onPresentationStateChange}/>
  <section className='ai-chart-interactive' aria-label='Visualización interactiva Plotly'>
    <h4>Visualización interactiva Plotly</h4>
    <ChartRangeControl items={viewportItems} value={normalizedViewport} onChange={onViewportStateChange} onReset={() => onViewportStateChange(undefined)}/>
    <div className='ai-plotly-container'>
      <PlotlyErrorBoundary key={chartRevision}>
        <React.Suspense fallback={<div className='ai-plotly-empty'>Preparando visualización interactiva...</div>}>
          <PlotlyChartView artifact={latestChartArtifact} revision={chartRevision} presentationState={presentationState} presentationModel={presentationModel} viewportState={normalizedViewport} viewportItems={viewportItems} onViewportStateChange={onViewportStateChange}/>
        </React.Suspense>
      </PlotlyErrorBoundary>
    </div>
  </section>
  <ChartPresentationStatistics presentationState={presentationState} presentationModel={presentationModel}/>
  </>}
</main>
}

export default ChartWorkspace