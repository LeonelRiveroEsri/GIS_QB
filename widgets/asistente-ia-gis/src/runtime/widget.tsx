import { React, type AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView, loadArcGISJSAPIModules } from 'jimu-arcgis'
import type { EntraAuthConfig, IMConfig } from '../config'
import { getStyle } from './style'
import defaultMessages from './translations/default'
import { MockAgentClient } from '../services/mock-agent-client'
import { CopilotStudioAgentClient } from '../services/copilot-studio-agent-client'
import { UnconfiguredTokenProvider } from '../services/token-provider'
import { isEntraAuthConfigComplete, MsalTokenProvider } from '../services/msal-token-provider'
import { EMPTY_GIS_CONTEXT } from '../utils/gis-context'
import type { AgentAction } from '../types/agent-action'
import { handleAuthorizedAgentAction } from './actions/authorized-agent-action-handler'
import { useAgentConversation } from './hooks/use-agent-conversation'
import { useGisContext } from './hooks/use-gis-context'
import { validateAgentIntegrationConfig } from '../validation/agent-integration-config-validator'
import ChartRenderer from './charts/chart-renderer'
import ChartWorkspace from './charts/chart-workspace'
import { applyChartArtifactVersion, getLatestChartArtifact, INITIAL_CHART_WORKSPACE_STATE } from './charts/chart-workspace-state'
import { applyChartPresentationPatch, type ChartPresentationPatch } from './charts/chart-presentation-state'
import type { ChartViewportState } from './charts/chart-viewport-state'

type ActiveView = 'chat' | 'charts'

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const t = (id: string) => props.intl.formatMessage({ id, defaultMessage: defaultMessages[id] })
  const [jimuMapView, setJimuMapView] = React.useState<JimuMapView>()
  const [prompt, setPrompt] = React.useState('')
  const [showEmptyPrompt, setShowEmptyPrompt] = React.useState(false)
  const [localNotice, setLocalNotice] = React.useState('')
  const [activeView, setActiveView] = React.useState<ActiveView>('chat')
  const [hasNewChart, setHasNewChart] = React.useState(false)
  const [chartWorkspaceState, setChartWorkspaceState] = React.useState(INITIAL_CHART_WORKSPACE_STATE)
  const [chartViewportState, setChartViewportState] = React.useState<ChartViewportState>()
  const { latestChartArtifact, chartRevision } = chartWorkspaceState
  const presentationState = chartWorkspaceState.presentationState
  const welcomeMessage = props.config.welcomeMessage || 'Consulta información del mapa y prepara análisis GIS asistidos.'
  const conversationRef = React.useRef<HTMLDivElement>()
  const promptId = `${props.id}-prompt`
  const chatTabId = `${props.id}-chat-tab`
  const chartsTabId = `${props.id}-charts-tab`
  const chatPanelId = `${props.id}-chat-panel`
  const chartsPanelId = `${props.id}-charts-panel`
  const gisContext = useGisContext(jimuMapView, props.config.maxContextLayers)
  const copilotConfig = props.config.copilotStudio
  const authConfig = props.config.auth as unknown as EntraAuthConfig
  const integrationValidation = validateAgentIntegrationConfig({ auth: authConfig, copilotStudio: copilotConfig })
  const integrationBlocked = (authConfig?.enabled === true || copilotConfig?.enabled === true) && !integrationValidation.valid
  const realIntegrationEnabled = copilotConfig?.enabled === true && integrationValidation.valid
  const tokenProvider = React.useMemo(() => integrationValidation.valid && isEntraAuthConfigComplete(authConfig)
    ? new MsalTokenProvider(authConfig)
    : new UnconfiguredTokenProvider(), [
    integrationValidation.valid,
    authConfig?.enabled,
    authConfig?.tenantId,
    authConfig?.clientId,
    authConfig?.redirectUri,
    authConfig?.scopes?.join('|')
  ])
  const agentClient = React.useMemo(() => realIntegrationEnabled
    ? new CopilotStudioAgentClient({
        endpoint: copilotConfig.endpoint,
        timeoutMs: copilotConfig.timeoutMs || 30000
      }, tokenProvider)
    : new MockAgentClient(), [realIntegrationEnabled, copilotConfig?.endpoint, copilotConfig?.timeoutMs, tokenProvider])
  const { messages, status, error, sendMessage, cancel, resetConversation } = useAgentConversation({
    agentClient,
    welcomeMessage,
    responseTitle: realIntegrationEnabled ? t('agentTitle') : t('pendingTitle'),
    gisContext: props.config.includeMapContext ? gisContext : EMPTY_GIS_CONTEXT,
    timeoutMs: realIntegrationEnabled ? copilotConfig.timeoutMs : undefined
  })

  React.useEffect(() => { conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, status])
  React.useEffect(() => {
    const latestArtifact = getLatestChartArtifact(messages)
    if (!latestArtifact || latestArtifact === latestChartArtifact) return
    setChartWorkspaceState(current => applyChartArtifactVersion(current, latestArtifact))
    setChartViewportState(undefined)
    if (activeView === 'chat') setHasNewChart(true)
  }, [messages, activeView, latestChartArtifact])

  const preparePrompt = () => {
    const value = prompt.trim()
    if (!value) { setShowEmptyPrompt(true); return }
    if (integrationBlocked) return
    if (sendMessage(value)) {
      setShowEmptyPrompt(false)
      setPrompt('')
    }
  }

  const updateChartPresentation = (patch: ChartPresentationPatch) => {
    setChartWorkspaceState(current => current.latestChartArtifact && current.presentationState
      ? { ...current, presentationState: applyChartPresentationPatch(current.latestChartArtifact, current.presentationState, patch) }
      : current)
    if (patch.xField !== undefined || patch.yField !== undefined || patch.xGrouping !== undefined || patch.aggregationMethod !== undefined || patch.trendType !== undefined || patch.projectionDays !== undefined) setChartViewportState(undefined)
  }

  const clearConversation = () => {
    resetConversation()
    setPrompt('')
    setShowEmptyPrompt(false)
    setLocalNotice('')
    setHasNewChart(false)
    setChartWorkspaceState(INITIAL_CHART_WORKSPACE_STATE)
    setChartViewportState(undefined)
  }

  const handleAction = async (action: AgentAction) => {
    const view = jimuMapView?.view
    const basemap = view?.map?.basemap
    const basemapLayers = new Set([
      ...(basemap?.baseLayers?.toArray?.() || []),
      ...(basemap?.referenceLayers?.toArray?.() || [])
    ])
    const availableLayers = view?.map?.allLayers?.toArray?.().map(layer => ({
      id: layer.id,
      type: layer.type,
      isBasemapLayer: basemapLayers.has(layer),
      isGroupLayer: layer.type === 'group',
      parentId: 'parent' in layer && layer.parent && 'id' in layer.parent
        ? layer.parent.id
        : undefined
    })) || []
    const actionResult = await handleAuthorizedAgentAction(action, {
      mapConnected: Boolean(jimuMapView),
      viewAvailable: Boolean(view),
      availableLayers
    }, {
      view,
      createPortalItemLayer: async ({ portalItemId, id, title, opacity }) => {
        const [ImageryTileLayer] = await loadArcGISJSAPIModules(['esri/layers/ImageryTileLayer']) as [any]
        return new ImageryTileLayer({ portalItem: { id: portalItemId }, id, title, opacity, visible: true })
      }
    })
    setLocalNotice(`${actionResult.code}: ${actionResult.message}`)
  }

  return <div css={getStyle()} className='ai-shell'>
    {props.useMapWidgetIds?.[0] && <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds[0]} onActiveViewChange={setJimuMapView} />}
    <header className='ai-header'>
      <div className='ai-eyebrow'>GIS · INTELIGENCIA ARTIFICIAL</div>
      <h2>{props.config.widgetTitle || 'Asistente GIS Teck QB - DTMS'}</h2>
      <p>{welcomeMessage}</p>
    </header>
    <div className={`ai-context${gisContext.mapConnected ? ' connected' : ''}`}>
      <i aria-hidden='true'/><span><strong>{gisContext.mapConnected ? t('mapConnected') : t('mapNotConnected')}</strong><small>{gisContext.mapConnected ? `${gisContext.mapTitle || gisContext.mapType || 'Web Map'} · ${gisContext.layerCount} ${t('totalLayers')} · ${gisContext.visibleLayerCount} ${t('visibleLayers')}` : t('context')}</small></span>
      {gisContext.mapConnected && <div className='ai-visible-layers'><strong>{t('visibleLayerTitles')}:</strong> {gisContext.visibleLayers.length > 0 ? gisContext.visibleLayers.map(layer => layer.title).join(', ') : t('noVisibleLayers')}</div>}
    </div>
    <nav className='ai-view-tabs' role='tablist' aria-label='Vistas del asistente'>
      <button type='button' id={chatTabId} role='tab' aria-selected={activeView === 'chat'} aria-controls={chatPanelId} className={activeView === 'chat' ? 'active' : ''} onClick={() => setActiveView('chat')}>Chat</button>
      <button type='button' id={chartsTabId} role='tab' aria-selected={activeView === 'charts'} aria-controls={chartsPanelId} className={activeView === 'charts' ? 'active' : ''} onClick={() => { setActiveView('charts'); setHasNewChart(false) }}>Gráficos{hasNewChart && <span className='ai-tab-notification' aria-label='Nuevo gráfico'> •</span>}</button>
    </nav>
    {activeView === 'chat' ? <div id={chatPanelId} className='ai-chat-view' role='tabpanel' aria-labelledby={chatTabId}>
      <main className='ai-conversation' ref={conversationRef} aria-live='polite'>
      {messages.map(message => <div key={message.id} className={`ai-message ${message.role}`}>
        {message.title && <strong>{message.title}</strong>}{message.content}
        {message.actions?.length > 0 && <div className='ai-proposals'>
          <span>{t('proposedActions')}</span>
          {message.actions.map(action => <button
            type='button'
            key={action.id}
            onClick={() => { void handleAction(action) }}
          >{action.title}</button>)}
        </div>}
        {message.artifacts?.length > 0 && <div className='ai-proposals'>
          <span>{t('availableArtifacts')}</span>
          {message.artifacts.map(artifact => artifact.type === 'chart'
            ? <ChartRenderer
              key={artifact.id}
              artifact={artifact}
              presentationState={artifact === latestChartArtifact ? presentationState : undefined}
              onPresentationStateChange={artifact === latestChartArtifact ? updateChartPresentation : undefined}
            />
            : <button
              type='button'
              key={artifact.id}
              onClick={() => setLocalNotice(t('artifactNotEnabled'))}
            >{artifact.title} ({artifact.type.toUpperCase()})</button>)}
        </div>}
      </div>)}
      {status === 'sending' && <div className='ai-message assistant'>{t('sending')}</div>}
      {error && <div className='ai-empty-warning' role='alert'>{error.code}: {error.message}</div>}
      {integrationBlocked && <div className='ai-local-notice' role='alert'>La integración del asistente no está configurada correctamente.</div>}
      {localNotice && <div className='ai-local-notice' role='status'>{localNotice}</div>}
      </main>
      <footer className='ai-composer'>
        <label className='ai-composer-label' htmlFor={promptId}>{t('promptLabel')}</label>
        <textarea id={promptId} value={prompt} placeholder={t('placeholder')} onChange={event => setPrompt(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); preparePrompt() } }}/>
        {showEmptyPrompt && <div className='ai-empty-warning'>{t('emptyPrompt')}</div>}
        <div className='ai-actions'><button type='button' className='ai-clear' onClick={clearConversation}>{t('clear')}</button>{status === 'sending' ? <button type='button' className='ai-send' onClick={cancel}>{t('cancel')}</button> : <button type='button' className='ai-send' onClick={preparePrompt}>{t('prepare')}</button>}</div>
      </footer>
    </div> : <ChartWorkspace panelId={chartsPanelId} tabId={chartsTabId} latestChartArtifact={latestChartArtifact} chartRevision={chartRevision} presentationState={presentationState} viewportState={chartViewportState} onPresentationStateChange={updateChartPresentation} onViewportStateChange={setChartViewportState}/>}
  </div>
}

export default Widget
