import type { DateRangeState, FilterKey, FilterState } from "./types";

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

export const EMPTY_DATE_RANGE: DateRangeState = {
  fechaInicio: "",
  fechaFin: "",
};

export const SUMMARY_OUT_FIELDS = [
  "OBJECTID",
  "CAMPANA",
  "POZO",
  "SENSOR",
  "SECTOR_GRUPO",
  "SECTOR_BASE",
  "DETALLE",
  "FECHA_MIN",
  "FECHA_MAX",
  "TOTAL_REGISTROS",
];
