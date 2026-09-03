import { evaluateLayerActionPolicy } from '../runtime/actions/layer-action-policy'
import type { GisContext, VisibleLayerContext } from '../types/gis-context'

/** Selects a deterministic mock proposal target; it does not authorize execution. */
export const findMockEligibleLayer = (gisContext?: GisContext): VisibleLayerContext | undefined =>
  gisContext?.visibleLayers.find(layer => evaluateLayerActionPolicy({
    id: layer.id,
    type: layer.type,
    isGroupLayer: layer.type === 'group'
  }).allowed)