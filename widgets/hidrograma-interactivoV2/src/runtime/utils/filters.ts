import { FILTER_FIELDS } from "../constants";
import type { DateRangeState, FilterKey, FilterState, SummaryRow } from "../types";

const cleanValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const uniqueSorted = (values: string[]): string[] => {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es", { numeric: true }),
  );
};

export const buildOptionsMap = (
  rows: SummaryRow[],
  filters: FilterState,
): Record<FilterKey, string[]> => {
  const result = {} as Record<FilterKey, string[]>;

  FILTER_FIELDS.forEach((field) => {
    const relatedRows = rows.filter((row) => {
      return FILTER_FIELDS.every((otherField) => {
        if (otherField === field) return true;

        const selected = filters[otherField] || [];
        if (selected.length === 0) return true;

        return selected.includes(cleanValue(row[otherField]));
      });
    });

    result[field] = uniqueSorted(
      relatedRows.map((row) => cleanValue(row[field])),
    );
  });

  return result;
};

export const normalizeSelectedFilters = (
  filters: FilterState,
  optionsMap: Record<FilterKey, string[]>,
): FilterState => {
  const normalized = {} as FilterState;

  FILTER_FIELDS.forEach((field) => {
    const available = new Set(optionsMap[field] || []);
    normalized[field] = (filters[field] || []).filter((value) =>
      available.has(value),
    );
  });

  return normalized;
};

export const getFilteredSummaryRows = (
  rows: SummaryRow[],
  filters: FilterState,
): SummaryRow[] => {
  return rows.filter((row) => {
    return FILTER_FIELDS.every((field) => {
      const selected = filters[field] || [];
      if (selected.length === 0) return true;

      return selected.includes(cleanValue(row[field]));
    });
  });
};

export const clearDependentFilters = (
  currentFilters: FilterState,
  changedField: FilterKey,
  values: string[],
): FilterState => {
  return {
    ...currentFilters,
    [changedField]: values,
  };
};

export const getDateRangeFromRows = (
  rows: SummaryRow[],
): DateRangeState => {
  const datesMin = rows
    .map((row) => cleanValue(row.FECHA_MIN))
    .filter(Boolean)
    .sort();

  const datesMax = rows
    .map((row) => cleanValue(row.FECHA_MAX))
    .filter(Boolean)
    .sort();

  return {
    fechaInicio: datesMin[0] || "",
    fechaFin: datesMax[datesMax.length - 1] || "",
  };
};

export const buildWhereIn = (field: string, values: string[]): string => {
  if (!values || values.length === 0) return "";

  const safeValues = values.map((value) => {
    const escaped = String(value).replace(/'/g, "''");
    return `'${escaped}'`;
  });

  return `${field} IN (${safeValues.join(", ")})`;
};

export const buildDateWhere = (
  dateRange: DateRangeState,
  field: string = "FECHA_HORA",
): string => {
  const clauses: string[] = [];

  if (dateRange.fechaInicio) {
    clauses.push(`${field} >= DATE '${dateRange.fechaInicio}'`);
  }

  if (dateRange.fechaFin) {
    clauses.push(`${field} <= DATE '${dateRange.fechaFin}'`);
  }

  return clauses.join(" AND ");
};

export const buildFinalWhere = (
  filters: FilterState,
  dateRange: DateRangeState,
  dateField: string = "FECHA_HORA",
): string => {
  const clauses: string[] = [];

  FILTER_FIELDS.forEach((field) => {
    const clause = buildWhereIn(field, filters[field]);
    if (clause) clauses.push(clause);
  });

  const dateClause = buildDateWhere(dateRange, dateField);
  if (dateClause) clauses.push(dateClause);

  return clauses.length > 0 ? clauses.join(" AND ") : "1=1";
};
