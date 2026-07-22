// =====================================================
// FILE: src/runtime/types.ts
// =====================================================
export type SummaryRow = {
  OBJECTID?: number;
  ID_SERIE: string;
  LABEL_SERIE: string;
  CAMPANA: string;
  POZO: string;
  SENSOR: string;
  PIEZOMETRO_SENSOR: string;
  SECTOR_GRUPO: string;
  SECTOR_BASE: string;
  DETALLE: string;
  FECHA_MIN: number | string | Date | null;
  FECHA_MAX: number | string | Date | null;
  FECHA_HORA_MIN: number | string | Date | null;
  FECHA_HORA_MAX: number | string | Date | null;
  COTA_COLLAR: number | null;
  ELEVACION_MIN: number | null;
  ELEVACION_MAX: number | null;
  ELEVACION_AVG: number | null;
  PROFUNDIDAD_SENSOR_MIN: number | null;
  PROFUNDIDAD_SENSOR_MAX: number | null;
  TEMPERATURA_MIN: number | null;
  TEMPERATURA_MAX: number | null;
  TOTAL_REGISTROS: number;
};

export type FilterKey =
  | "CAMPANA"
  | "POZO"
  | "SENSOR"
  | "SECTOR_GRUPO"
  | "SECTOR_BASE"
  | "DETALLE";

export type FilterState = Record<FilterKey, string[]>;

export type Option = {
  label: string;
  value: string;
};

export type DateRangeState = {
  fechaInicio: string;
  fechaFin: string;
};


export type DetailRow = {
  OBJECTID?: number
  CAMPANA?: string
  FECHA?: string | number | Date | null
  HORA?: string | null
  FECHA_HORA?: string | number | Date | null
  ELEVACION?: number | null
  PROFUNDIDAD_SENSOR?: number | null
  TEMPERATURA?: number | null
  POZO?: string
  SENSOR?: string
  COTA_COLLAR?: number | null
  ESTATUS?: string
  OBS?: string
  PIEZOMETRO_SENSOR?: string
  SECTOR_GRUPO?: string
  SECTOR_BASE?: string
  DETALLE?: string
}

export type SeriesSummary = {
  id: string
  serie: string
  pozo: string
  sensor: string
  tipo: 'ELEVACION' | 'COTA_COLLAR'
  ultimoValor: number
  fechaUltimoRegistro: string | number | Date | null
  visible: boolean
}
