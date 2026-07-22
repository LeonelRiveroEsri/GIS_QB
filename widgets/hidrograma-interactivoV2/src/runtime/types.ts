export type FilterKey =
  | "CAMPANA"
  | "POZO"
  | "SENSOR"
  | "SECTOR_GRUPO"
  | "SECTOR_BASE"
  | "DETALLE";

export type FilterState = Record<FilterKey, string[]>;

export type DateRangeState = {
  fechaInicio: string;
  fechaFin: string;
};

export type SummaryRow = {
  OBJECTID?: number;
  CAMPANA?: string;
  POZO?: string;
  SENSOR?: string;
  SECTOR_GRUPO?: string;
  SECTOR_BASE?: string;
  DETALLE?: string;
  FECHA_MIN?: string;
  FECHA_MAX?: string;
  TOTAL_REGISTROS?: number;
  [key: string]: any;
};
export type DetailRow = {
  OBJECTID?: number;
  CAMPANA?: string;
  FECHA?: number | string | Date;
  HORA?: string;
  FECHA_HORA?: number | string | Date;
  ELEVACION?: number;
  PROFUNDIDAD_SENSOR?: number;
  TEMPERATURA?: number;
  POZO?: string;
  SENSOR?: string;
  COTA_COLLAR?: number;
  ESTATUS?: string;
  OBS?: string;
  PIEZOMETRO_SENSOR?: string;
  SECTOR_GRUPO?: string;
  SECTOR_BASE?: string;
  DETALLE?: string;
  [key: string]: any;
};

export type SeriesSummary = {
  id: string;
  serie: string;
  label?: string;
  pozo: string;
  sensor: string;
  tipo: "ELEVACION" | "COTA_COLLAR";
  visible: boolean;
  ultimoValor?: number | string;
  fechaUltimoRegistro?: string;
};
