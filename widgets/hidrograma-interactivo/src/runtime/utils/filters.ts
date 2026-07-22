// =====================================================
// FILE: src/runtime/utils/filters.ts
// =====================================================
import { FILTER_FIELDS } from "../constants";
import { FilterKey, FilterState, Option, SummaryRow } from "../types";

export function normalizeTextValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function getUniqueOptionsFromSummary(
  rows: SummaryRow[],
  field: FilterKey,
): Option[] {
  return Array.from(
    new Set(
      rows
        .map((row) => normalizeTextValue(row[field]))
        .filter((value) => value !== ""),
    ),
  )
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((value) => ({ label: value, value }));
}

export function buildOptionsMap(
  rows: SummaryRow[],
  filters: FilterState,
): Record<FilterKey, Option[]> {
  const result = {} as Record<FilterKey, Option[]>;

  FILTER_FIELDS.forEach((field, index) => {
    const previousFields = FILTER_FIELDS.slice(0, index);

    const filteredRows = rows.filter((row) => {
      return previousFields.every((previousField) => {
        const selected = filters[previousField];
        const value = normalizeTextValue(row[previousField]);
        return selected.length === 0 || selected.includes(value);
      });
    });

    result[field] = getUniqueOptionsFromSummary(filteredRows, field);
  });

  return result;
}

export function normalizeSelectedFilters(
  filters: FilterState,
  optionsMap: Record<FilterKey, Option[]>,
): FilterState {
  const nextFilters = { ...filters };

  FILTER_FIELDS.forEach((field) => {
    const validValues = new Set(
      optionsMap[field].map((option) => option.value),
    );
    nextFilters[field] = nextFilters[field].filter((value) =>
      validValues.has(value),
    );
  });

  return nextFilters;
}

export function clearDependentFilters(
  filters: FilterState,
  changedField: FilterKey,
  values: string[],
): FilterState {
  const nextFilters = {
    ...filters,
    [changedField]: values,
  };

  const changedIndex = FILTER_FIELDS.indexOf(changedField);

  FILTER_FIELDS.slice(changedIndex + 1).forEach((field) => {
    nextFilters[field] = [];
  });

  return nextFilters;
}

export function getFilteredSummaryRows(
  rows: SummaryRow[],
  filters: FilterState,
): SummaryRow[] {
  return rows.filter((row) => {
    return FILTER_FIELDS.every((field) => {
      const selected = filters[field];
      const value = normalizeTextValue(row[field]);
      return selected.length === 0 || selected.includes(value);
    });
  });
}

export function getDateRangeFromRows(rows: SummaryRow[]): {
  fechaMin: string;
  fechaMax: string;
} {
  const fechasMin = rows
    .map((row) => row.FECHA_MIN)
    .filter((value) => value !== null && value !== undefined)
    .map((value) => new Date(value as any).getTime())
    .filter((value) => !Number.isNaN(value));

  const fechasMax = rows
    .map((row) => row.FECHA_MAX)
    .filter((value) => value !== null && value !== undefined)
    .map((value) => new Date(value as any).getTime())
    .filter((value) => !Number.isNaN(value));

  if (fechasMin.length === 0 || fechasMax.length === 0) {
    return {
      fechaMin: "",
      fechaMax: "",
    };
  }

  const minDate = new Date(Math.min(...fechasMin));
  const maxDate = new Date(Math.max(...fechasMax));

  return {
    fechaMin: minDate.toISOString().slice(0, 10),
    fechaMax: maxDate.toISOString().slice(0, 10),
  };
}
