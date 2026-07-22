// =====================================================
// FILE: src/runtime/components/FilterPanel.tsx
// =====================================================
import React, { useMemo } from "react";
import { EMPTY_FILTERS, FILTER_FIELDS, FILTER_LABELS } from "../constants";
import { DateRangeState, FilterKey, FilterState, SummaryRow } from "../types";
import {
  buildOptionsMap,
  clearDependentFilters,
  getDateRangeFromRows,
  getFilteredSummaryRows,
  normalizeSelectedFilters,
} from "../utils/filters";
import { MultiSelectBlock } from "./MultiSelectBlock";

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cfd8e3",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  color: "#102a43",
  background: "#fff",
  boxSizing: "border-box",
};

const panelStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #d9e2ec",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 10px 24px rgba(16, 42, 67, 0.06)",
};

type Props = {
  rows: SummaryRow[];
  filters: FilterState;
  dateRange: DateRangeState;
  loading: boolean;
  onFiltersChange: (filters: FilterState) => void;
  onDateRangeChange: (dateRange: DateRangeState) => void;
  onApply: (payload: {
    filters: FilterState;
    dateRange: DateRangeState;
    rows: SummaryRow[];
  }) => void;
};

export function FilterPanel(props: Props) {
  const {
    rows,
    filters,
    dateRange,
    loading,
    onFiltersChange,
    onDateRangeChange,
    onApply,
  } = props;

  const optionsMap = useMemo(
    () => buildOptionsMap(rows, filters),
    [rows, filters],
  );
  const normalizedFilters = useMemo(
    () => normalizeSelectedFilters(filters, optionsMap),
    [filters, optionsMap],
  );
  const filteredRows = useMemo(
    () => getFilteredSummaryRows(rows, normalizedFilters),
    [rows, normalizedFilters],
  );
  const availableDateRange = useMemo(
    () => getDateRangeFromRows(filteredRows),
    [filteredRows],
  );

  const totalRegistros = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => acc + Number(row.TOTAL_REGISTROS || 0),
      0,
    );
  }, [filteredRows]);

  const updateFilter = (field: FilterKey, values: string[]) => {
    const nextFilters = clearDependentFilters(normalizedFilters, field, values);
    onFiltersChange(nextFilters);
  };

  const clearAll = () => {
    onFiltersChange({ ...EMPTY_FILTERS });
  };

  const handleApply = () => {
    onApply({
      filters: normalizedFilters,
      dateRange,
      rows: filteredRows,
    });
  };

  return (
    <div style={panelStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#102a43" }}>
            Filtros del hidrograma
          </h2>
          <div style={{ color: "#627d98", fontSize: 14, marginTop: 4 }}>
            Fuente: HIDROGRAMA_FILTROS · Series disponibles:{" "}
            {filteredRows.length.toLocaleString("es-CL")} · Registros asociados:{" "}
            {totalRegistros.toLocaleString("es-CL")}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={clearAll}
            style={{
              border: "1px solid #cfd8e3",
              borderRadius: 10,
              background: "#fff",
              padding: "10px 14px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Limpiar filtros
          </button>

          <button
            type="button"
            onClick={handleApply}
            style={{
              border: "1px solid #0b5cab",
              borderRadius: 10,
              background: "#0b5cab",
              color: "#fff",
              padding: "10px 16px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Aplicar filtros
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
          gap: 16,
          alignItems: "start",
        }}
      >
        {FILTER_FIELDS.map((field) => (
          <MultiSelectBlock
            key={field}
            title={FILTER_LABELS[field]}
            options={optionsMap[field]}
            selected={normalizedFilters[field]}
            disabled={loading || rows.length === 0}
            onChange={(values) => updateFilter(field, values)}
          />
        ))}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minWidth: 0,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, color: "#102a43" }}>
            FECHA
          </div>

          <input
            type="date"
            value={dateRange.fechaInicio}
            min={availableDateRange.fechaMin || undefined}
            max={availableDateRange.fechaMax || undefined}
            onChange={(e) =>
              onDateRangeChange({ ...dateRange, fechaInicio: e.target.value })
            }
            style={inputStyle}
          />

          <input
            type="date"
            value={dateRange.fechaFin}
            min={availableDateRange.fechaMin || undefined}
            max={availableDateRange.fechaMax || undefined}
            onChange={(e) =>
              onDateRangeChange({ ...dateRange, fechaFin: e.target.value })
            }
            style={inputStyle}
          />

          <div style={{ fontSize: 12, color: "#627d98" }}>
            Disponible: {availableDateRange.fechaMin || "—"} a{" "}
            {availableDateRange.fechaMax || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
