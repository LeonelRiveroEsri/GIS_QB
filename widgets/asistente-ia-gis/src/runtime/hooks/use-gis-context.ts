import reactiveUtils from 'esri/core/reactiveUtils'
import { React } from 'jimu-core'
import type { JimuMapView } from 'jimu-arcgis'
import type { GisContext } from '../../types/gis-context'
import { buildGisContext, EMPTY_GIS_CONTEXT } from '../../utils/gis-context'

export const useGisContext = (jimuMapView: JimuMapView | undefined, maxVisibleLayers: number): GisContext => {
  const [gisContext, setGisContext] = React.useState<GisContext>(EMPTY_GIS_CONTEXT)

  React.useEffect(() => {
    const map = jimuMapView?.view?.map
    if (!map) {
      setGisContext(EMPTY_GIS_CONTEXT)
      return
    }

    const refresh = () => setGisContext(buildGisContext(jimuMapView, maxVisibleLayers))
    const handle = reactiveUtils.watch(
      () => [
        map.allLayers.map(layer => `${layer.id}:${layer.visible}`).join('|'),
        jimuMapView.view.extent?.xmin,
        jimuMapView.view.extent?.ymin,
        jimuMapView.view.extent?.xmax,
        jimuMapView.view.extent?.ymax,
        jimuMapView.view.spatialReference?.wkid,
        jimuMapView.view.spatialReference?.latestWkid
      ].join('|'),
      refresh,
      { initial: true }
    )

    return () => handle.remove()
  }, [jimuMapView, maxVisibleLayers])

  return gisContext
}
