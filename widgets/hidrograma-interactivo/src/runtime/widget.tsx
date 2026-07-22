import { AllWidgetProps } from "jimu-core";
import React, { useEffect, useMemo, useState } from "react";
import { FilterPanel } from "./components/FilterPanel";
import { SeriesTable } from "./components/SeriesTable";
import { SummaryChips } from "./components/SummaryChips";
import { EMPTY_FILTERS } from "./constants";
import "./style.css";

import { ChartPanel } from "./components/ChartPanel";
import { ExportBar } from "./components/ExportBar";
import MapPanel from "./components/MapPanel";
import { queryDetailRows } from "./services/detailService";
import { queryAllSummaryRows } from "./services/summaryService";
import {
  DateRangeState,
  DetailRow,
  FilterState,
  SeriesSummary,
  SummaryRow,
} from "./types";
import { getDateRangeFromRows } from "./utils/filters";
import { buildSeriesSummaries } from "./utils/series";
import { buildDetailWhere, validateDetailQuery } from "./utils/where";

export interface Config {}

const rootStyle: React.CSSProperties = {
  padding: 16,
  background: "#eef1f5",
  height: "100%",
  width: "100%",
  boxSizing: "border-box",
  overflowY: "auto",
  overflowX: "hidden",
};

const contentStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 1780,
  margin: "0 auto",
  boxSizing: "border-box",
};

const panelStyle: React.CSSProperties = {
  marginTop: 18,
  background: "#ffffff",
  border: "1px solid #d9e2ec",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 10px 24px rgba(16, 42, 67, 0.06)",
};

const LoadingOverlay = ({
  text = "Aplicando filtros",
  subtext = "Consultando datos y construyendo series...",
}: {
  text?: string;
  subtext?: string;
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 18,
      }}
    >
      <div
        style={{
          minWidth: 280,
          padding: "24px 30px",
          borderRadius: 18,
          background: "#ffffff",
          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.16)",
          border: "1px solid #d9e2ec",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: "4px solid #dbeafe",
            borderTopColor: "#0b5cab",
            margin: "0 auto",
            animation: "hidroSpin 0.8s linear infinite",
          }}
        />

        <div
          style={{
            marginTop: 14,
            fontSize: 16,
            fontWeight: 800,
            color: "#102a43",
          }}
        >
          {text}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            color: "#627d98",
            fontWeight: 500,
          }}
        >
          {subtext}
        </div>
      </div>
    </div>
  );
};

const Widget = (_props: AllWidgetProps<Config>) => {
  const [summaryRows, setSummaryRows] = useState<SummaryRow[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS });
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeState>({
    fechaInicio: "",
    fechaFin: "",
  });

  const [detailRows, setDetailRows] = useState<DetailRow[]>([]);
  const [series, setSeries] = useState<SeriesSummary[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [lastWhere, setLastWhere] = useState<string>("");

  useEffect(() => {
    let alive = true;

    const loadSummary = async () => {
      try {
        setLoadingSummary(true);
        setSummaryError(null);

        const rows = await queryAllSummaryRows();

        if (!alive) return;

        setSummaryRows(rows);

        const range = getDateRangeFromRows(rows);

        setDateRange({
          fechaInicio: range.fechaMin,
          fechaFin: range.fechaMax,
        });
      } catch (error) {
        console.error("Error cargando HIDROGRAMA_FILTROS:", error);

        if (!alive) return;

        setSummaryError(
          error instanceof Error
            ? error.message
            : "Error desconocido cargando tabla resumen.",
        );
      } finally {
        if (alive) {
          setLoadingSummary(false);
        }
      }
    };

    loadSummary();

    return () => {
      alive = false;
    };
  }, []);

  const summaryText = useMemo(() => {
    if (loadingSummary) return "Cargando tabla resumen HIDROGRAMA_FILTROS...";
    if (summaryError) return `Error cargando tabla resumen: ${summaryError}`;

    return `Tabla resumen cargada: ${summaryRows.length.toLocaleString("es-CL")} combinaciones disponibles.`;
  }, [loadingSummary, summaryError, summaryRows.length]);

  const chartDateRangeText = useMemo(() => {
    if (!detailRows.length) return "-";

    const dates = detailRows
      .map((row) => row.FECHA ?? row.FECHA_HORA)
      .filter((value) => value !== null && value !== undefined)
      .map((value) => new Date(value as any).getTime())
      .filter((value) => !Number.isNaN(value));

    if (!dates.length) return "-";

    const minDate = new Date(Math.min(...dates)).toISOString().slice(0, 10);
    const maxDate = new Date(Math.max(...dates)).toISOString().slice(0, 10);

    return `${minDate} a ${maxDate}`;
  }, [detailRows]);

  const handleApply = async (payload: {
    filters: FilterState;
    dateRange: DateRangeState;
    rows: SummaryRow[];
  }) => {
    const errors = validateDetailQuery(payload.filters, payload.dateRange);

    if (errors.length > 0) {
      setDetailError(errors.join(" "));
      return;
    }

    const where = buildDetailWhere(payload.filters, payload.dateRange);

    try {
      setLoadingDetail(true);
      setHasAppliedFilters(true);
      setDetailError(null);
      setLastWhere(where);

      const rows = await queryDetailRows(where);

      console.log("WHERE detalle:", where);
      console.log("Registros detalle:", rows.length);
      console.log("Primer registro detalle:", rows[0]);

      const nextSeries = buildSeriesSummaries(rows);

      console.log("Series generadas:", nextSeries.length);
      console.log("Series:", nextSeries);

      setDetailRows(rows);
      setSeries(nextSeries);
      setHasAppliedFilters(true);
    } catch (error) {
      console.error("Error consultando detalle:", error);

      setDetailRows([]);
      setSeries([]);

      setDetailError(
        error instanceof Error
          ? error.message
          : "Error desconocido consultando tabla detalle.",
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleClearAll = () => {
    setHasAppliedFilters(false);
    setDetailRows([]);
    setSeries([]);
    setDetailError(null);
    setLastWhere("");

    const range = getDateRangeFromRows(summaryRows);

    setDateRange({
      fechaInicio: range.fechaMin,
      fechaFin: range.fechaMax,
    });
  };

  const handleToggleSerie = (id: string, visible: boolean) => {
    setSeries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, visible } : item)),
    );
  };

  const handleOnlySerie = (id: string) => {
    setSeries((prev) =>
      prev.map((item) => ({
        ...item,
        visible: item.id === id,
      })),
    );
  };

  const handleShowAllSeries = () => {
    setSeries((prev) =>
      prev.map((item) => ({
        ...item,
        visible: true,
      })),
    );
  };

  const handleHideAllSeries = () => {
    setSeries((prev) =>
      prev.map((item) => ({
        ...item,
        visible: false,
      })),
    );
  };
  return (
    <div style={rootStyle}>
      <div style={contentStyle}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 30, color: "#102a43" }}>
            Hidrograma Interactivo
          </h1>

          <div
            style={{
              fontSize: 15,
              color: summaryError ? "#b42318" : "#486581",
              fontWeight: summaryError ? 800 : 500,
            }}
          >
            {summaryText}
          </div>
        </div>

        <div style={{ position: "relative" }}>
          {loadingDetail && (
            <LoadingOverlay
              text="Aplicando filtros"
              subtext="Consultando datos y preparando hidrograma..."
            />
          )}

          <FilterPanel
            rows={summaryRows}
            filters={filters}
            dateRange={dateRange}
            loading={loadingSummary || loadingDetail}
            onFiltersChange={setFilters}
            onDateRangeChange={setDateRange}
            onApply={handleApply}
          />
        </div>

        {(hasAppliedFilters || loadingDetail) && (
          <>
            <div
              style={{
                ...panelStyle,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <SummaryChips
                records={detailRows.length}
                series={series.length}
                rango={chartDateRangeText}
                loading={loadingDetail}
              />

              <ExportBar
                rows={detailRows}
                series={series}
                disabled={loadingDetail}
              />

              {detailError && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 12,
                    background: "#fff1f0",
                    color: "#b42318",
                    fontWeight: 800,
                    border: "1px solid #ffd3cf",
                  }}
                >
                  {detailError}
                </div>
              )}

              <SeriesTable
                series={series}
                onToggleSerie={handleToggleSerie}
                onOnlySerie={handleOnlySerie}
                onShowAll={handleShowAllSeries}
                onHideAll={handleHideAllSeries}
              />

              <div
                style={{
                  marginTop: 18,
                  minHeight: 480,
                  border: "2px dashed #cbd5e1",
                  borderRadius: 14,
                  background: "#fafafa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6b7280",
                  textAlign: "center",
                  padding: 20,
                }}
              >
                <ChartPanel
                  rows={detailRows}
                  series={series}
                  loading={loadingDetail}
                  onToggleSeries={handleToggleSerie}
                />
              </div>

              <MapPanel rows={detailRows} loading={loadingDetail} />
            </div>

            <div style={panelStyle}>
              <h3 style={{ marginTop: 0, color: "#102a43" }}>
                Estado técnico temporal
              </h3>

              <div style={{ color: "#627d98", marginBottom: 10 }}>
                Este bloque se puede eliminar después. Sirve para validar la
                consulta de detalle.
              </div>

              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: 12,
                  color: "#243b53",
                  background: "#f7f9fc",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                {JSON.stringify(
                  {
                    lastWhere,
                    detailRows: detailRows.length,
                    series: series.length,
                    visibleSeries: series.filter((item) => item.visible).length,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Widget;
