import type { DateRangeState, FilterState } from "../types";

function escapeSqlText(value: string): string {
  return value.replace(/'/g, "''");
}

function buildInClause(field: string, values: string[]): string | null {
  if (!values || values.length === 0) return null;

  const cleanValues = values
    .filter(
      (value) =>
        value !== null && value !== undefined && String(value).trim() !== "",
    )
    .map((value) => `'${escapeSqlText(String(value).trim())}'`);

  if (cleanValues.length === 0) return null;

  if (cleanValues.length === 1) {
    return `${field} = ${cleanValues[0]}`;
  }

  return `${field} IN (${cleanValues.join(",")})`;
}

export function buildDetailWhere(
  filters: FilterState,
  dateRange: DateRangeState,
): string {
  const clauses: string[] = [];

  const filterFields = [
    "CAMPANA",
    "POZO",
    "SENSOR",
    "SECTOR_GRUPO",
    "SECTOR_BASE",
    "DETALLE",
  ] as const;

  filterFields.forEach((field) => {
    const clause = buildInClause(field, filters[field]);

    if (clause) {
      clauses.push(clause);
    }
  });

  if (dateRange.fechaInicio) {
    clauses.push(`FECHA_HORA >= TIMESTAMP '${dateRange.fechaInicio} 00:00:00'`);
  }

  if (dateRange.fechaFin) {
    clauses.push(`FECHA_HORA <= TIMESTAMP '${dateRange.fechaFin} 23:59:59'`);
  }

  return clauses.length > 0 ? clauses.join(" AND ") : "1=2";
}

export function validateDetailQuery(filters: FilterState): string[] {
  const errors: string[] = [];

  if (!filters.CAMPANA.length) {
    errors.push("Debe seleccionar al menos una CAMPANA.");
  }

  if (!filters.POZO.length) {
    errors.push("Debe seleccionar al menos un POZO.");
  }

  return errors;
}
