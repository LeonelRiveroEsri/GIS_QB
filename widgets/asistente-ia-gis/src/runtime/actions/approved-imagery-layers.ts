export interface ApprovedImageryLayer {
  portalItemId: string
  layerId: string
  title: string
}

export const APPROVED_IMAGERY_LAYERS: readonly ApprovedImageryLayer[] = [
  {
    portalItemId: '096c67f44e6d499ab1f016fde6893592',
    layerId: 'asistente-imagen-tmf',
    title: 'IMAGEN_TMF'
  },
  {
    portalItemId: '80559637d5f54adb85dc470cf4398aaf',
    layerId: 'asistente-imagen-mina',
    title: 'IMAGEN_MINA'
  }
]

export const isApprovedImageryLayer = (portalItemId: string, layerId: string): boolean =>
  APPROVED_IMAGERY_LAYERS.some(layer => layer.portalItemId === portalItemId && layer.layerId === layerId)

export const isApprovedManagedLayerId = (layerId: string): boolean =>
  APPROVED_IMAGERY_LAYERS.some(layer => layer.layerId === layerId)
