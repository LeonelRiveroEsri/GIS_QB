import { SessionManager } from 'jimu-core'
import { DetailRow } from '../types'
import { buildPozosWhereFromDetailRows } from '../utils/mapWhere'

export const WEBMAP_ID = '67a29111b44c421fb977f3f5f6a74074'

export const POZOS_LAYER_URL =
  'https://services8.arcgis.com/ooZ6ebRuTSh0HnTQ/arcgis/rest/services/WL_PIEZOMETROS_GEOTECNIA/FeatureServer/0'

export const POZOS_OUT_FIELDS = [
  'OBJECTID',
  'PIEZOMETRO_SENSOR',
  'X_COLLAR',
  'Y_COLLAR',
  'Z_COLLAR',
  'X_SENSOR',
  'Y_SENSOR',
  'Z_SENSOR',
  'SERIE_SENSOR',
  'PROF_INSTALACION',
  'INCLINACION',
  'AZIMUTH',
  'FECHA',
  'ELEVACION',
  'DIF_ACUMULADO',
  'DIF_CONSECUTIVO',
  'GlobalID',
  'CAMPANA',
  'POZO',
  'SENSOR',
  'POZO_SENSOR',
  'SECTOR_GRUPO',
  'SECTOR_BASE',
  'DETALLE'
]

export type PozoFeatureAttributes = {
  OBJECTID?: number
  PIEZOMETRO_SENSOR?: string
  X_COLLAR?: number
  Y_COLLAR?: number
  Z_COLLAR?: number
  X_SENSOR?: number
  Y_SENSOR?: number
  Z_SENSOR?: number
  SERIE_SENSOR?: string
  PROF_INSTALACION?: number
  INCLINACION?: number
  AZIMUTH?: number
  FECHA?: number | string | Date | null
  ELEVACION?: number
  DIF_ACUMULADO?: number
  DIF_CONSECUTIVO?: number
  GlobalID?: string
  CAMPANA?: string
  POZO?: string
  SENSOR?: string
  POZO_SENSOR?: string
  SECTOR_GRUPO?: string
  SECTOR_BASE?: string
  DETALLE?: string
}

export type PozoFeature = {
  attributes: PozoFeatureAttributes
  geometry?: any
}

type ArcGISQueryResponse = {
  features?: PozoFeature[]
  error?: {
    message?: string
    details?: string[]
  }
}

async function getUserToken (): Promise<string> {
  const session = SessionManager.getInstance().getMainSession()

  if (!session) {
    throw new Error('No hay sesión activa de ArcGIS.')
  }

  const token = await session.getToken(POZOS_LAYER_URL)

  if (!token) {
    throw new Error('No se pudo obtener token para consultar la capa de pozos.')
  }

  return token
}

export async function queryPozosByDetailRows (
  rows: DetailRow[]
): Promise<PozoFeature[]> {
  if (!rows.length) return []

  const token = await getUserToken()
  const where = buildPozosWhereFromDetailRows(rows)

  const pageSize = 2000
  let offset = 0
  const features: PozoFeature[] = []

  while (true) {
    const params = new URLSearchParams({
      f: 'json',
      where,
      outFields: POZOS_OUT_FIELDS.join(','),
      returnGeometry: 'true',
      outSR: '102100',
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
      token
    })

    const response = await fetch(`${POZOS_LAYER_URL}/query?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`Error HTTP consultando pozos: ${response.status}`)
    }

    const data = await response.json() as ArcGISQueryResponse

    if (data.error) {
      throw new Error(
        `${data.error.message ?? 'Error ArcGIS REST'} ${data.error.details?.join(' ') ?? ''}`
      )
    }

    const chunk = data.features ?? []

    if (!chunk.length) break

    features.push(...chunk)

    if (chunk.length < pageSize) break

    offset += pageSize
  }

  return features
}
