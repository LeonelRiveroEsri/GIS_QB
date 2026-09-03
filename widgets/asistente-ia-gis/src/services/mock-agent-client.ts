import type { AgentClient, AgentClientOptions } from './agent-client'
import type { AgentRequest } from '../types/agent-request'
import type { AgentResponse } from '../types/agent-response'
import type { AgentAction } from '../types/agent-action'
import type { AgentArtifact } from '../types/agent-artifact'
import { findMockEligibleLayer } from './mock-eligible-layer'

export type MockAgentScenario = 'text' | 'zoom_to_extent' | 'zoom_to_layer' | 'set_layer_visibility' | 'pdf_artifact' | 'line_chart' | 'bar_chart' | 'scatter_chart' | 'area_chart' | 'histogram_chart' | 'donut_chart' | 'chart_update_1' | 'chart_update_2' | 'chart_update_bar' | 'combined' | 'load_tmf' | 'load_mina' | 'show_tmf' | 'hide_tmf' | 'show_mina' | 'hide_mina' | 'zoom_tmf' | 'zoom_mina' | 'compare_imagery'

const createNamedError = (name: 'AbortError' | 'TimeoutError', message: string): Error => {
  const error = new Error(message)
  error.name = name
  return error
}

export class MockAgentClient implements AgentClient {
  constructor (private readonly delayMs = 700, private readonly scenario?: MockAgentScenario) {}

  send (request: AgentRequest, options: AgentClientOptions = {}): Promise<AgentResponse> {
    return new Promise((resolve, reject) => {
      let completed = false
      let responseTimer: ReturnType<typeof setTimeout>
      let timeoutTimer: ReturnType<typeof setTimeout> | undefined

      const cleanup = () => {
        clearTimeout(responseTimer)
        if (timeoutTimer) clearTimeout(timeoutTimer)
        options.signal?.removeEventListener('abort', onAbort)
      }

      const finish = (callback: () => void) => {
        if (completed) return
        completed = true
        cleanup()
        callback()
      }

      const onAbort = () => finish(() => reject(createNamedError('AbortError', 'La solicitud fue cancelada.')))

      if (options.signal?.aborted) {
        onAbort()
        return
      }

      options.signal?.addEventListener('abort', onAbort, { once: true })

      responseTimer = setTimeout(() => finish(() => resolve(this.createResponse(request))), this.delayMs)

      if (options.timeoutMs !== undefined) {
        timeoutTimer = setTimeout(
          () => finish(() => reject(createNamedError('TimeoutError', 'La solicitud simulada excedió el tiempo máximo.'))),
          Math.max(0, options.timeoutMs)
        )
      }
    })
  }

  private createResponse (request: AgentRequest): AgentResponse {
    const scenario = this.scenario || this.scenarioFromMessage(request.message)
    const actions = this.createActions(scenario, request)
    const artifacts = this.createArtifacts(scenario)
    const missingLayerCandidate = (scenario === 'zoom_to_layer' || scenario === 'set_layer_visibility') && actions.length === 0

    return {
      schemaVersion: '1.0',
      requestId: request.requestId,
      conversationId: request.conversationId || `mock-${request.requestId}`,
      status: 'completed',
      message: scenario === 'text'
        ? 'La conexión con Asistente GIS Teck QB - DTMS todavía está pendiente.'
        : scenario === 'line_chart'
          ? 'Evolución simulada de cota del pelo de agua.'
          : scenario === 'chart_update_1'
            ? 'Primera versión del gráfico actualizable.'
            : scenario === 'chart_update_2'
              ? 'Gráfico actualizado con nuevos registros.'
              : scenario === 'chart_update_bar'
                ? 'Gráfico actualizado a barras.'
          : scenario === 'bar_chart'
            ? 'Comparación simulada por categoría.'
            : scenario === 'scatter_chart'
              ? 'Relación simulada entre superficie y volumen.'
              : scenario === 'area_chart'
                ? 'Evolución simulada de superficie.'
                : scenario === 'histogram_chart'
                  ? 'Distribución simulada de cotas.'
                  : scenario === 'donut_chart'
                    ? 'Distribución simulada por paddock.'
        : missingLayerCandidate
          ? 'No existe una capa visible elegible para preparar esta acción simulada.'
        : 'Resultado simulado preparado. Confirma una acción para aplicarla al mapa.',
      ...(actions.length > 0 ? { actions } : {}),
      ...(artifacts.length > 0 ? { artifacts } : {})
    }
  }

  private scenarioFromMessage (message: string): MockAgentScenario {
    const normalized = message.toLowerCase()
    if (normalized.includes('[mock:load-tmf]')) return 'load_tmf'
    if (normalized.includes('[mock:load-mina]')) return 'load_mina'
    if (normalized.includes('[mock:show-tmf]')) return 'show_tmf'
    if (normalized.includes('[mock:hide-tmf]')) return 'hide_tmf'
    if (normalized.includes('[mock:show-mina]')) return 'show_mina'
    if (normalized.includes('[mock:hide-mina]')) return 'hide_mina'
    if (normalized.includes('[mock:zoom-tmf]')) return 'zoom_tmf'
    if (normalized.includes('[mock:zoom-mina]')) return 'zoom_mina'
    if (normalized.includes('[mock:compare-imagery]')) return 'compare_imagery'
    if (normalized.includes('[mock:zoom-layer]')) return 'zoom_to_layer'
    if (normalized.includes('[mock:zoom]')) return 'zoom_to_extent'
    if (normalized.includes('[mock:visibility]')) return 'set_layer_visibility'
    if (normalized.includes('[mock:pdf]')) return 'pdf_artifact'
    if (normalized.includes('[mock:chart-update-1]')) return 'chart_update_1'
    if (normalized.includes('[mock:chart-update-2]')) return 'chart_update_2'
    if (normalized.includes('[mock:chart-update-bar]')) return 'chart_update_bar'
    if (normalized.includes('[mock:scatter-chart]')) return 'scatter_chart'
    if (normalized.includes('[mock:area-chart]')) return 'area_chart'
    if (normalized.includes('[mock:histogram-chart]')) return 'histogram_chart'
    if (normalized.includes('[mock:donut-chart]')) return 'donut_chart'
    if (normalized.includes('[mock:bar-chart]')) return 'bar_chart'
    if (normalized.includes('[mock:chart]')) return 'line_chart'
    if (normalized.includes('[mock:combined]')) return 'combined'
    return 'text'
  }

  private createActions (scenario: MockAgentScenario, request: AgentRequest): AgentAction[] {
    const extent = request.gisContext?.extent || { xmin: -70.5, ymin: -22.5, xmax: -68.5, ymax: -20.5 }
    const eligibleLayer = findMockEligibleLayer(request.gisContext)
    const zoom: AgentAction = {
      id: 'mock-zoom-extent',
      type: 'zoom_to_extent',
      title: 'Acercar al área propuesta',
      extent,
      spatialReference: request.gisContext?.spatialReference
    }
    const zoomLayer: AgentAction[] = eligibleLayer
      ? [{ id: 'mock-zoom-layer', type: 'zoom_to_layer', title: 'Acercar a capa propuesta', layerId: eligibleLayer.id }]
      : []
    const visibility: AgentAction[] = eligibleLayer
      ? [{ id: 'mock-layer-visibility', type: 'set_layer_visibility', title: 'Ocultar capa propuesta', layerId: eligibleLayer.id, visible: false }]
      : []

    const tmfLayer = (opacity = 1, zoomToLayer = false): AgentAction => ({
      id: `mock-load-tmf-${opacity}-${zoomToLayer}`,
      type: 'load_portal_item_layer',
      title: zoomToLayer ? 'Cargar y acercar a IMAGEN_TMF' : 'Cargar IMAGEN_TMF',
      portalItemId: '096c67f44e6d499ab1f016fde6893592',
      layerId: 'asistente-imagen-tmf',
      opacity,
      zoom: zoomToLayer
    })
    const minaLayer = (opacity = 1, zoomToLayer = false): AgentAction => ({
      id: `mock-load-mina-${opacity}-${zoomToLayer}`,
      type: 'load_portal_item_layer',
      title: zoomToLayer ? 'Cargar y acercar a IMAGEN_MINA' : 'Cargar IMAGEN_MINA',
      portalItemId: '80559637d5f54adb85dc470cf4398aaf',
      layerId: 'asistente-imagen-mina',
      opacity,
      zoom: zoomToLayer
    })
    const managedVisibility = (layerId: string, title: string, visible: boolean): AgentAction => ({
      id: `mock-${visible ? 'show' : 'hide'}-${layerId}`,
      type: 'set_layer_visibility',
      title: `${visible ? 'Mostrar' : 'Ocultar'} ${title}`,
      layerId,
      visible
    })

    if (scenario === 'load_tmf') return [tmfLayer(1, true)]
    if (scenario === 'load_mina') return [minaLayer(1, true)]
    if (scenario === 'zoom_tmf') return [tmfLayer(1, true)]
    if (scenario === 'zoom_mina') return [minaLayer(1, true)]
    if (scenario === 'show_tmf') return [{ ...tmfLayer(1, true), id: 'mock-show-tmf', title: 'Mostrar y acercar a IMAGEN_TMF' }]
    if (scenario === 'hide_tmf') return [managedVisibility('asistente-imagen-tmf', 'IMAGEN_TMF', false)]
    if (scenario === 'show_mina') return [{ ...minaLayer(1, true), id: 'mock-show-mina', title: 'Mostrar y acercar a IMAGEN_MINA' }]
    if (scenario === 'hide_mina') return [managedVisibility('asistente-imagen-mina', 'IMAGEN_MINA', false)]
    if (scenario === 'compare_imagery') return [minaLayer(1), tmfLayer(0.55, true)]

    if (scenario === 'zoom_to_extent') return [zoom]
    if (scenario === 'zoom_to_layer') return zoomLayer
    if (scenario === 'set_layer_visibility') return visibility
    if (scenario === 'combined') return [zoom, ...visibility]
    return []
  }

  private createArtifacts (scenario: MockAgentScenario): AgentArtifact[] {
    if (scenario === 'chart_update_1') return [{
      id: 'mock-updatable-chart',
      type: 'chart',
      title: 'Evolución de cota actualizable',
      chartType: 'line',
      xField: 'fecha',
      yField: 'cota',
      data: [
        { fecha: '01/01/2026', cota: 3880 },
        { fecha: '02/01/2026', cota: 3881 },
        { fecha: '03/01/2026', cota: 3882 }
      ]
    }]
    if (scenario === 'chart_update_2') return [{
      id: 'mock-updatable-chart',
      type: 'chart',
      title: 'Evolución de cota actualizada',
      chartType: 'line',
      xField: 'fecha',
      yField: 'cota',
      data: [
        { fecha: '01/01/2026', cota: 3880 },
        { fecha: '02/01/2026', cota: 3881.5 },
        { fecha: '03/01/2026', cota: 3882.25 },
        { fecha: '04/01/2026', cota: 3883 }
      ]
    }]
    if (scenario === 'chart_update_bar') return [{
      id: 'mock-updatable-chart',
      type: 'chart',
      title: 'Cota actualizada por fecha',
      chartType: 'bar',
      xField: 'fecha',
      yField: 'cota',
      data: [
        { fecha: '01/01/2026', cota: 3880 },
        { fecha: '02/01/2026', cota: 3881.5 },
        { fecha: '03/01/2026', cota: 3882.25 },
        { fecha: '04/01/2026', cota: 3883 }
      ]
    }]
    if (scenario === 'line_chart') return [{
      id: 'mock-water-elevation-chart',
      type: 'chart',
      title: 'Evolución de cota',
      chartType: 'line',
      xField: 'fecha',
      yField: 'cota',
      data: [
        { fecha: '01/06/2026', cota: 3880.4, superficie: 149.8, volumen: 118400, paddock: 'P01' },
        { fecha: '08/06/2026', cota: 3881.2, superficie: 150.7, volumen: 120100, paddock: 'P02' },
        { fecha: '15/06/2026', cota: 3882.1, superficie: 151.8, volumen: 122000, paddock: 'P03' },
        { fecha: '21/06/2026', cota: 3882.9, superficie: 152.667, volumen: 123456, paddock: 'P04' }
      ]
    }]
    if (scenario === 'bar_chart') return [{
      id: 'mock-category-chart',
      type: 'chart',
      title: 'Valores por categoría',
      chartType: 'bar',
      xField: 'categoria',
      yField: 'valor',
      data: [
        { categoria: 'Norte', valor: 18 },
        { categoria: 'Centro', valor: 27 },
        { categoria: 'Sur', valor: 22 }
      ]
    }]
    if (scenario === 'scatter_chart') return [{
      id: 'mock-surface-volume-scatter',
      type: 'chart',
      title: 'Relación superficie y volumen',
      chartType: 'scatter',
      xField: 'superficie',
      yField: 'volumen',
      data: [
        { fecha: '01/06/2026', cota: 3880.4, superficie: 149.8, volumen: 118400, paddock: 'P01' },
        { fecha: '08/06/2026', cota: 3881.2, superficie: 150.7, volumen: 120100, paddock: 'P02' },
        { fecha: '15/06/2026', cota: 3882.1, superficie: 151.8, volumen: 122000, paddock: 'P03' },
        { fecha: '21/06/2026', cota: 3882.9, superficie: 152.667, volumen: 123456, paddock: 'P04' }
      ]
    }]
    if (scenario === 'area_chart') return [{
      id: 'mock-surface-area-chart',
      type: 'chart',
      title: 'Evolución de superficie',
      chartType: 'area',
      xField: 'fecha',
      yField: 'superficie',
      data: [
        { fecha: '01/06/2026', superficie: 149.8 },
        { fecha: '08/06/2026', superficie: 150.7 },
        { fecha: '15/06/2026', superficie: 151.8 },
        { fecha: '21/06/2026', superficie: 152.667 }
      ]
    }]
    if (scenario === 'histogram_chart') return [{
      id: 'mock-elevation-histogram',
      type: 'chart',
      title: 'Distribución de cotas',
      chartType: 'histogram',
      xField: 'fecha',
      yField: 'cota',
      data: [
        { fecha: '01/06/2026', paddock: 'P01', cota: 3880.4, superficie: 149.8, volumen: 118400 },
        { fecha: '04/06/2026', paddock: 'P01', cota: 3880.8, superficie: 150.1, volumen: 119200 },
        { fecha: '08/06/2026', paddock: 'P02', cota: 3881.2, superficie: 150.7, volumen: 120100 },
        { fecha: '12/06/2026', paddock: 'P02', cota: 3881.7, superficie: 151.1, volumen: 121000 },
        { fecha: '15/06/2026', paddock: 'P03', cota: 3882.1, superficie: 151.8, volumen: 122000 },
        { fecha: '18/06/2026', paddock: 'P03', cota: 3882.5, superficie: 152.2, volumen: 122700 },
        { fecha: '21/06/2026', paddock: 'P04', cota: 3882.9, superficie: 152.667, volumen: 123456 }
      ]
    }]
    if (scenario === 'donut_chart') return [{
      id: 'mock-paddock-donut',
      type: 'chart',
      title: 'Registros por paddock',
      chartType: 'donut',
      xField: 'paddock',
      yField: 'cota',
      data: [
        { fecha: '01/06/2026', paddock: 'P01', cota: 3880.4, superficie: 149.8, volumen: 118400 },
        { fecha: '08/06/2026', paddock: 'P01', cota: 3881.2, superficie: 150.7, volumen: 120100 },
        { fecha: '15/06/2026', paddock: 'P02', cota: 3882.1, superficie: 151.8, volumen: 122000 },
        { fecha: '21/06/2026', paddock: 'P03', cota: 3882.9, superficie: 152.667, volumen: 123456 }
      ]
    }]
    if (scenario !== 'pdf_artifact' && scenario !== 'combined') return []
    return [{
      id: 'mock-map-pdf',
      type: 'pdf',
      title: 'Mapa PDF simulado',
      url: 'https://example.invalid/artifacts/mapa-simulado.pdf',
      metadata: {
        generator: 'GENERAR_MAPA_PDF_AGENTE_GIS_V3',
        simulated: true
      }
    }]
  }
}
