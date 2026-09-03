export interface LayerActionPolicyInput {
  id?: string
  title?: string
  type?: string
  isBasemapLayer?: boolean
  isGroupLayer?: boolean
  parentId?: string
  url?: string
}

export type LayerActionPolicyCode =
  | 'LAYER_ALLOWED'
  | 'LAYER_ID_MISSING'
  | 'BASEMAP_LAYER_NOT_ALLOWED'
  | 'GROUP_LAYER_NOT_ALLOWED'
  | 'LAYER_TYPE_NOT_ALLOWED'

export interface LayerActionPolicyResult {
  allowed: boolean
  code: LayerActionPolicyCode
}

export const ALLOWED_LAYER_ACTION_TYPES = new Set([
  'feature',
  'map-image',
  'imagery',
  'tile',
  'vector-tile',
  'scene'
])

/** Classifies a local layer without reading titles, URLs, or external state. */
export const evaluateLayerActionPolicy = (layer: LayerActionPolicyInput): LayerActionPolicyResult => {
  if (typeof layer.id !== 'string' || layer.id.trim().length === 0) {
    return { allowed: false, code: 'LAYER_ID_MISSING' }
  }
  if (layer.isBasemapLayer === true) return { allowed: false, code: 'BASEMAP_LAYER_NOT_ALLOWED' }
  if (layer.isGroupLayer === true || layer.type === 'group') {
    return { allowed: false, code: 'GROUP_LAYER_NOT_ALLOWED' }
  }
  if (typeof layer.type !== 'string' || !ALLOWED_LAYER_ACTION_TYPES.has(layer.type)) {
    return { allowed: false, code: 'LAYER_TYPE_NOT_ALLOWED' }
  }
  return { allowed: true, code: 'LAYER_ALLOWED' }
}