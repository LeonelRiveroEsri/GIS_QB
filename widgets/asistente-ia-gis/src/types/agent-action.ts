import type { GisExtent, GisSpatialReference } from './gis-context'

interface AgentActionBase {
  id: string
  title: string
}

export interface ZoomToExtentAction extends AgentActionBase {
  type: 'zoom_to_extent'
  extent: GisExtent
  spatialReference?: GisSpatialReference
}

export interface ZoomToLayerAction extends AgentActionBase {
  type: 'zoom_to_layer'
  layerId: string
}

export interface SetLayerVisibilityAction extends AgentActionBase {
  type: 'set_layer_visibility'
  layerId: string
  visible: boolean
}

export interface LoadPortalItemLayerAction extends AgentActionBase {
  type: 'load_portal_item_layer'
  portalItemId: string
  layerId: string
  opacity?: number
  zoom?: boolean
}

export interface SetLayerOpacityAction extends AgentActionBase {
  type: 'set_layer_opacity'
  layerId: string
  opacity: number
}

export interface OpenUrlAction extends AgentActionBase {
  type: 'open_url'
  url: string
}

export type AgentAction =
  | ZoomToExtentAction
  | ZoomToLayerAction
  | SetLayerVisibilityAction
  | LoadPortalItemLayerAction
  | SetLayerOpacityAction
  | OpenUrlAction

/**
 * A future AgentActionExecutor must validate these structured actions against
 * an allowlist and the current map before execution. Free text must never
 * modify the map.
 */
