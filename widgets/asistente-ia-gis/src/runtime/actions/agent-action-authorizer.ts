import type { AgentAction } from '../../types/agent-action'
import {
  evaluateLayerActionPolicy,
  type LayerActionPolicyInput
} from './layer-action-policy'
import { isApprovedImageryLayer, isApprovedManagedLayerId } from './approved-imagery-layers'

export interface AgentActionAuthorizationContext {
  mapConnected: boolean
  viewAvailable: boolean
  availableLayers: readonly LayerActionPolicyInput[]
}

export type AgentActionAuthorizationCode =
  | 'ACTION_AUTHORIZED'
  | 'MAP_NOT_CONNECTED'
  | 'MAP_VIEW_UNAVAILABLE'
  | 'LAYER_NOT_ALLOWED'
  | 'LAYER_NOT_ALLOWED_BY_POLICY'
  | 'ACTION_NOT_ENABLED'
  | 'ACTION_NOT_SUPPORTED'

export interface AgentActionAuthorizationResult {
  authorized: boolean
  code: AgentActionAuthorizationCode
  message: string
}

const result = (
  authorized: boolean,
  code: AgentActionAuthorizationCode,
  message: string
): AgentActionAuthorizationResult => ({ authorized, code, message })

/** Decides authorization from current local map state without executing effects. */
export const authorizeAgentAction = (
  action: AgentAction,
  context: AgentActionAuthorizationContext
): AgentActionAuthorizationResult => {
  if (action.type === 'open_url') {
    return result(false, 'ACTION_NOT_ENABLED', 'Esta acción todavía no está habilitada.')
  }
  if (!context.mapConnected) {
    return result(false, 'MAP_NOT_CONNECTED', 'No hay un mapa conectado.')
  }
  if (!context.viewAvailable) {
    return result(false, 'MAP_VIEW_UNAVAILABLE', 'La vista del mapa no está disponible.')
  }
  if (action.type === 'zoom_to_extent') {
    return result(true, 'ACTION_AUTHORIZED', 'Acción autorizada.')
  }
  if (action.type === 'load_portal_item_layer') {
    return isApprovedImageryLayer(action.portalItemId, action.layerId)
      ? result(true, 'ACTION_AUTHORIZED', 'Acción autorizada.')
      : result(false, 'LAYER_NOT_ALLOWED', 'El elemento solicitado no está autorizado para carga.')
  }
  if (action.type === 'set_layer_opacity' && !isApprovedManagedLayerId(action.layerId)) {
    return result(false, 'LAYER_NOT_ALLOWED', 'La capa solicitada no está administrada por el asistente.')
  }
  if (action.type === 'zoom_to_layer' || action.type === 'set_layer_visibility' || action.type === 'set_layer_opacity') {
    const layer = context.availableLayers.find(candidate => candidate.id === action.layerId)
    if (!layer) {
      return result(false, 'LAYER_NOT_ALLOWED', 'La capa solicitada no pertenece al mapa actual.')
    }
    const policyResult = evaluateLayerActionPolicy(layer)
    if (!policyResult.allowed) {
      return result(false, 'LAYER_NOT_ALLOWED_BY_POLICY', 'La capa solicitada no está habilitada para acciones del asistente.')
    }
    return result(true, 'ACTION_AUTHORIZED', 'Acción autorizada.')
  }
  return result(false, 'ACTION_NOT_SUPPORTED', 'Este tipo de acción no está soportado.')
}
