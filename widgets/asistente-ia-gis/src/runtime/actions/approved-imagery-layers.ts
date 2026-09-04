export interface ApprovedImageryLayer {
  portalItemId: string
  layerId: string
  title: string
  serviceUrl: string
}

export const APPROVED_IMAGERY_LAYERS: readonly ApprovedImageryLayer[] = [
  {
    portalItemId: '096c67f44e6d499ab1f016fde6893592',
    layerId: 'asistente-imagen-tmf',
    title: 'IMAGEN_TMF',
    serviceUrl: 'https://tiledimageservices8.arcgis.com/ooZ6ebRuTSh0HnTQ/arcgis/rest/services/CopyRaster_6H9RHE/ImageServer'
  },
  {
    portalItemId: '80559637d5f54adb85dc470cf4398aaf',
    layerId: 'asistente-imagen-mina',
    title: 'IMAGEN_MINA',
    serviceUrl: 'https://tiledimageservices8.arcgis.com/ooZ6ebRuTSh0HnTQ/arcgis/rest/services/IMAGEN_DIARIA_MINA_20251029_125419/ImageServer'
  }
]

export const isApprovedImageryLayer = (portalItemId: string, layerId: string): boolean =>
  APPROVED_IMAGERY_LAYERS.some(layer => layer.portalItemId === portalItemId && layer.layerId === layerId)

export const isApprovedManagedLayerId = (layerId: string): boolean =>
  APPROVED_IMAGERY_LAYERS.some(layer => layer.layerId === layerId)

export const getApprovedImageryLayer = (portalItemId: string, layerId: string): ApprovedImageryLayer | undefined =>
  APPROVED_IMAGERY_LAYERS.find(layer => layer.portalItemId === portalItemId && layer.layerId === layerId)
