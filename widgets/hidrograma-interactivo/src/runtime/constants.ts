// =====================================================
// FILE: src/runtime/constants.ts
// =====================================================
import { FilterKey, FilterState } from "./types";

export const SUMMARY_ITEM_ID = "b8b44b009c29411aa42d2a783b9118ce";

// Confirmar con Python:
// tabla_resumen.properties.id
export const SUMMARY_TABLE_ID = 1;

export const SUMMARY_OUT_FIELDS = [
  "OBJECTID",
  "ID_SERIE",
  "LABEL_SERIE",
  "CAMPANA",
  "POZO",
  "SENSOR",
  "PIEZOMETRO_SENSOR",
  "SECTOR_GRUPO",
  "SECTOR_BASE",
  "DETALLE",
  "FECHA_MIN",
  "FECHA_MAX",
  "FECHA_HORA_MIN",
  "FECHA_HORA_MAX",
  "COTA_COLLAR",
  "ELEVACION_MIN",
  "ELEVACION_MAX",
  "ELEVACION_AVG",
  "PROFUNDIDAD_SENSOR_MIN",
  "PROFUNDIDAD_SENSOR_MAX",
  "TEMPERATURA_MIN",
  "TEMPERATURA_MAX",
  "TOTAL_REGISTROS",
];

export const FILTER_FIELDS: FilterKey[] = [
  "CAMPANA",
  "POZO",
  "SENSOR",
  "SECTOR_GRUPO",
  "SECTOR_BASE",
  "DETALLE",
];

export const FILTER_LABELS: Record<FilterKey, string> = {
  CAMPANA: "CAMPANA",
  POZO: "POZO",
  SENSOR: "SENSOR",
  SECTOR_GRUPO: "SECTOR_GRUPO",
  SECTOR_BASE: "SECTOR_BASE",
  DETALLE: "DETALLE",
};

export const EMPTY_FILTERS: FilterState = {
  CAMPANA: [],
  POZO: [],
  SENSOR: [],
  SECTOR_GRUPO: [],
  SECTOR_BASE: [],
  DETALLE: [],
};
