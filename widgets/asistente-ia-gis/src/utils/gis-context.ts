import type Layer from 'esri/layers/Layer'
import type { JimuMapView } from 'jimu-arcgis'
import type { GisContext, VisibleLayerContext } from '../types/gis-context'
import { sanitizeContextUrl } from './sanitize-url'

const isEffectivelyVisible = (layer: Layer): boolean => {
  if (!layer.visible) return false

  let parent = layer.parent
  while (parent) {
    if ('visible' in parent && parent.visible === false) return false
    parent = 'parent' in parent ? parent.parent : undefined
  }

  return true
}

const belongsToExcludedTree = (layer: Layer, excludedRoots: Set<Layer>): boolean => {
  let current: Layer | undefined = layer
  while (current) {
    if (excludedRoots.has(current)) return true
    current = current.parent && 'type' in current.parent ? current.parent as Layer : undefined
  }
  return false
}

const hasUsableLayerId = (layer: Layer): boolean => typeof layer.id === 'string' && layer.id.trim().length > 0

export const EMPTY_GIS_CONTEXT: GisContext = {
  schemaVersion: '1.0',
  mapConnected: false,
  mapTitle: '',
  mapType: '',
  visibleLayers: [],
  layerCount: 0,
  visibleLayerCount: 0,
  maxContextLayers: 20
}

export const buildGisContext = (jimuMapView: JimuMapView | undefined, maxVisibleLayers: number): GisContext => {
  const limit = Math.max(1, Number(maxVisibleLayers) || 20)
  const view = jimuMapView?.view
  const map = view?.map
  if (!map) return { ...EMPTY_GIS_CONTEXT, maxContextLayers: limit }

  const layers = map.allLayers?.toArray?.() || []
  const excludedRoots = new Set<Layer>([
    ...(map.basemap?.baseLayers?.toArray?.() || []),
    ...(map.basemap?.referenceLayers?.toArray?.() || []),
    ...(map.basemap?.groundLayers?.toArray?.() || []),
    ...(map.ground?.layers?.toArray?.() || [])
  ])
  const operationalLayers = layers.filter(layer =>
    hasUsableLayerId(layer) &&
    layer.type !== 'group' &&
    !belongsToExcludedTree(layer, excludedRoots)
  )
  const visibleLayers = operationalLayers.filter(isEffectivelyVisible)
  const extent = view.extent
  const spatialReference = view.spatialReference

  return {
    schemaVersion: '1.0',
    mapConnected: true,
    mapTitle: map.portalItem?.title || '',
    mapType: view.type || '',
    mapPortalItemId: map.portalItem?.id || undefined,
    extent: extent
      ? { xmin: extent.xmin, ymin: extent.ymin, xmax: extent.xmax, ymax: extent.ymax }
      : undefined,
    spatialReference: spatialReference
      ? { wkid: spatialReference.wkid || undefined, latestWkid: spatialReference.latestWkid || undefined }
      : undefined,
    visibleLayers: visibleLayers.slice(0, limit).map((layer): VisibleLayerContext => ({
      id: layer.id,
      title: layer.title || layer.id || 'Capa sin título',
      type: layer.type,
      portalItemId: layer.portalItem?.id || undefined,
      url: sanitizeContextUrl('url' in layer && typeof layer.url === 'string' ? layer.url : undefined)
    })),
    layerCount: operationalLayers.length,
    visibleLayerCount: visibleLayers.length,
    maxContextLayers: limit
  }
}
