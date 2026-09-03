export interface VisibleLayerContext {
  id: string
  title: string
  type?: string
  portalItemId?: string
  url?: string
}

export interface GisExtent {
  xmin: number
  ymin: number
  xmax: number
  ymax: number
}

export interface GisSpatialReference {
  wkid?: number
  latestWkid?: number
}

export interface GisContext {
  schemaVersion: '1.0'
  mapConnected: boolean
  mapTitle: string
  mapType: string
  mapPortalItemId?: string
  extent?: GisExtent
  spatialReference?: GisSpatialReference
  visibleLayers: VisibleLayerContext[]
  layerCount: number
  visibleLayerCount: number
  maxContextLayers: number
}
