import type { AgentAction } from '../../types/agent-action'

interface ExecutableLayer {
  id?: string
  title?: string
  visible: boolean
  fullExtent?: unknown
  opacity?: number
  load?: () => Promise<unknown>
}

interface ExecutableMap {
  findLayerById: (layerId: string) => ExecutableLayer | null | undefined
  add: (layer: ExecutableLayer) => void
}

interface ExecutableView {
  map?: ExecutableMap
  goTo: (target: unknown) => Promise<unknown>
}

export interface AgentActionExecutionContext {
  view?: ExecutableView
  createPortalItemLayer?: (properties: { portalItemId: string, id: string, title: string, opacity: number }) => Promise<ExecutableLayer>
}

export interface AgentActionExecutionResult {
  success: boolean
  actionType: AgentAction['type']
  code: string
  message: string
}

const result = (
  success: boolean,
  actionType: AgentAction['type'],
  code: string,
  message: string
): AgentActionExecutionResult => ({ success, actionType, code, message })

const findLayer = (context: AgentActionExecutionContext, layerId: string): ExecutableLayer | undefined =>
  context.view?.map?.findLayerById(layerId) ?? undefined

/** Executes only validated AgentAction objects against the currently connected view. */
export const executeAgentAction = async (
  action: AgentAction,
  context: AgentActionExecutionContext
): Promise<AgentActionExecutionResult> => {
  if (action.type === 'open_url') {
    return result(false, action.type, 'ACTION_NOT_ENABLED', 'La apertura de enlaces todavía no está habilitada.')
  }
  if (!context.view) {
    return result(false, action.type, 'MAP_VIEW_UNAVAILABLE', 'No hay una vista de mapa conectada.')
  }

  try {
    if (action.type === 'zoom_to_extent') {
      const extent = {
        ...action.extent,
        ...(action.spatialReference ? { spatialReference: { ...action.spatialReference } } : {})
      }
      await context.view.goTo(extent)
      return result(true, action.type, 'ACTION_EXECUTED', 'Zoom aplicado al mapa.')
    }

    if (action.type === 'zoom_to_layer') {
      const layer = findLayer(context, action.layerId)
      if (!layer) return result(false, action.type, 'LAYER_NOT_FOUND', 'La capa indicada no existe en el mapa conectado.')
      if (!layer.fullExtent) {
        return result(false, action.type, 'LAYER_EXTENT_UNAVAILABLE', 'La capa no tiene una extensión disponible.')
      }
      await context.view.goTo(layer.fullExtent)
      return result(true, action.type, 'ACTION_EXECUTED', 'Zoom aplicado a la capa.')
    }

    if (action.type === 'set_layer_visibility') {
      const layer = findLayer(context, action.layerId)
      if (!layer) return result(false, action.type, 'LAYER_NOT_FOUND', 'La capa indicada no existe en el mapa conectado.')
      layer.visible = action.visible
      return result(true, action.type, 'ACTION_EXECUTED', 'Visibilidad de la capa actualizada.')
    }

    if (action.type === 'set_layer_opacity') {
      const layer = findLayer(context, action.layerId)
      if (!layer) return result(false, action.type, 'LAYER_NOT_FOUND', 'La capa indicada no existe en el mapa conectado.')
      layer.opacity = action.opacity
      return result(true, action.type, 'ACTION_EXECUTED', 'Transparencia de la capa actualizada.')
    }

    if (action.type === 'load_portal_item_layer') {
      const existing = findLayer(context, action.layerId)
      const layer = existing || await context.createPortalItemLayer?.({
        portalItemId: action.portalItemId,
        id: action.layerId,
        title: action.title,
        opacity: action.opacity ?? 1
      })
      if (!layer) return result(false, action.type, 'LAYER_FACTORY_UNAVAILABLE', 'No fue posible preparar la capa de imágenes.')
      layer.visible = true
      layer.opacity = action.opacity ?? 1
      if (!existing) context.view.map?.add(layer)
      if (layer.load) await layer.load()
      if (action.zoom && layer.fullExtent) await context.view.goTo(layer.fullExtent)
      return result(true, action.type, existing ? 'LAYER_REUSED' : 'LAYER_LOADED', existing ? 'La capa ya estaba cargada y fue actualizada.' : 'Capa cargada en el mapa.')
    }

    return result(false, (action as AgentAction).type, 'ACTION_NOT_SUPPORTED', 'El tipo de acción no está soportado.')
  } catch {
    return result(false, action.type, 'ACTION_EXECUTION_FAILED', 'No fue posible ejecutar la acción GIS.')
  }
}
