import { React } from "jimu-core";
import type { DetailRow, SeriesSummary } from "../types";
import {
  buildExportFilename,
  buildExportRows,
  exportRowsToCsv,
  exportRowsToXlsx,
} from "../utils/export";
import { ChartPanel } from "./ChartPanel";
import { SeriesResultTable, type ResultSerieRow } from "./SeriesResultTable";

type Props = {
  open: boolean;
  rows: ResultSerieRow[];
  detailRows: DetailRow[];
  series: SeriesSummary[];
  loading?: boolean;
  error?: string | null;
  onRowsChange: (rows: ResultSerieRow[]) => void;
  onSeriesChange: (series: SeriesSummary[]) => void;
  onClose: () => void;
};

export default function ResultPanel(props: Props) {
  const {
    open,
    rows,
    detailRows,
    series,
    loading,
    error,
    onRowsChange,
    onSeriesChange,
    onClose,
  } = props;
  const [maximized, setMaximized] = React.useState<boolean>(false);
  const [collapsed, setCollapsed] = React.useState<boolean>(false);
  const [activeTab, setActiveTab] = React.useState<"series" | "chart">(
    "series",
  );

  React.useEffect(() => {
    if (open) {
      setCollapsed(false);
      setActiveTab("series");
      setMaximized(false);
    }
  }, [open]);
  const exportRows = React.useMemo(
    () => buildExportRows(detailRows, series),
    [detailRows, series],
  );
  const exportDisabled = exportRows.length === 0 || loading;
  const [exporting, setExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);

  const isExportDisabled = exportDisabled || exporting;

  const handleExportCsv = () => {
    try {
      setExportError(null);
      exportRowsToCsv(exportRows, buildExportFilename("csv"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error exportando CSV.";
      setExportError(msg);
      console.error("Error exportando CSV", e);
    }
  };

  const handleExportXlsx = async () => {
    try {
      setExportError(null);
      setExporting(true);

      await exportRowsToXlsx(exportRows, buildExportFilename("xlsx"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error exportando XLSX.";
      setExportError(msg);
      console.error("Error exportando XLSX", e);
    } finally {
      setExporting(false);
    }
  };

  if (!open) return null;

  const panelHeight = collapsed
    ? "58px"
    : maximized
      ? "calc(100vh - 20px)"
      : activeTab === "chart"
        ? "70vh"
        : "60vh";
  const syncRowsAndSeries = (nextRows: ResultSerieRow[]) => {
    onRowsChange(nextRows);

    const visibilityMap = new Map(nextRows.map((row) => [row.id, row.visible]));

    onSeriesChange(
      series.map((item) => ({
        ...item,
        visible: visibilityMap.get(item.id) ?? item.visible,
      })),
    );
  };

  const tabButtonStyle = (tab: "series" | "chart"): React.CSSProperties => ({
    border: "1px solid #cfd8e3",
    borderRadius: 999,
    padding: "7px 14px",
    fontWeight: 800,
    background: activeTab === tab ? "#0b5cab" : "#ffffff",
    color: activeTab === tab ? "#ffffff" : "#102a43",
    cursor: "pointer",
  });

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: panelHeight,
        background: "#ffffff",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        boxShadow: "0 -8px 24px rgba(0,0,0,0.18)",
        overflow: "hidden",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        transition: "height 0.25s ease",
        top: maximized && !collapsed ? 10 : "auto",
        height: panelHeight,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={() =>
            setMaximized((prev) => {
              const next = !prev;
              if (next) {
                // al maximizar, asegurarse de que no esté colapsado
                setCollapsed(false);
              }
              return next;
            })
          }
          title={maximized ? "Restaurar panel" : "Maximizar panel"}
          style={{
            border: "none",
            background: "transparent",
            fontSize: 18,
            lineHeight: 1,
            cursor: "pointer",
            color: "#102a43",
          }}
        >
          {maximized ? "🗗" : "🗖"}
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            fontSize: 24,
            lineHeight: 1,
            cursor: "pointer",
            color: "#102a43",
          }}
        >
          ×
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          setCollapsed((prev) => {
            const next = !prev;
            if (next) {
              // al colapsar, cancelar maximizado para evitar conflictos
              setMaximized(false);
            }
            return next;
          });
        }}
        title={collapsed ? "Expandir resultados" : "Colapsar resultados"}
        style={{
          width: 44,
          height: 6,
          background: "#cbd2d9",
          borderRadius: 999,
          border: "none",
          margin: "8px auto 4px auto",
          cursor: "pointer",
          padding: 0,
        }}
      />

      <div
        style={{
          padding: "8px 16px",
          borderBottom: collapsed ? "none" : "1px solid #e4e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 42,
        }}
      >
        <button
          type="button"
          onClick={() => {
            setCollapsed((prev) => {
              const next = !prev;
              if (next) setMaximized(false);
              return next;
            });
          }}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            fontWeight: 900,
            color: "#102a43",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>{collapsed ? "︿" : "﹀"}</span>
          <span>Resultados del hidrograma</span>
          <span style={{ color: "#627d98", fontWeight: 700 }}>
            · {rows.length.toLocaleString("es-CL")} series
          </span>
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            fontSize: 24,
            lineHeight: 1,
            cursor: "pointer",
            color: "#102a43",
          }}
        >
          ×
        </button>
      </div>

      {!collapsed && (
        <>
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "8px 16px",
              borderBottom: "1px solid #e4e7eb",
              background: "#ffffff",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("series")}
              style={tabButtonStyle("series")}
            >
              Series
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("chart")}
              style={tabButtonStyle("chart")}
            >
              Gráfico
            </button>

            <div style={{ width: 10 }} />

            <button
              type="button"
              disabled={isExportDisabled}
              onClick={handleExportCsv}
              title="Exportar CSV"
              style={{
                border: 0,
                borderRadius: 10,
                padding: "8px 12px",
                cursor: isExportDisabled ? "not-allowed" : "pointer",
                fontWeight: 900,
                background: isExportDisabled ? "#94a3b8" : "#0f766e",
                color: "#ffffff",
              }}
            >
              Exportar CSV
            </button>

            <button
              type="button"
              disabled={isExportDisabled}
              onClick={handleExportXlsx}
              title="Exportar XLSX"
              style={{
                border: 0,
                borderRadius: 10,
                padding: "8px 12px",
                cursor: isExportDisabled ? "not-allowed" : "pointer",
                fontWeight: 900,
                background: isExportDisabled ? "#94a3b8" : "#0f766e",
                color: "#ffffff",
              }}
            >
              {exporting ? "Exportando XLSX..." : "Exportar XLSX"}
            </button>

            <div style={{ flex: 1 }} />
            <div style={{ color: "#627d98", fontSize: 13 }}>
              Filas visibles: {exportRows.length.toLocaleString("es-CL")}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: 12,
              background: "#fbfdff",
            }}
          >
            {error && (
              <div
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 10,
                  background: "#fff1f0",
                  color: "#b42318",
                  fontWeight: 800,
                  border: "1px solid #ffd3cf",
                }}
              >
                {error}
              </div>
            )}

            {exportError && (
              <div
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 10,
                  background: "#fff1f0",
                  color: "#b42318",
                  fontWeight: 800,
                  border: "1px solid #ffd3cf",
                }}
              >
                {exportError}
              </div>
            )}

            {loading && rows.length === 0 ? (
              <div style={{ padding: 22, color: "#627d98", fontWeight: 800 }}>
                Consultando series...
              </div>
            ) : (
              <>
                {activeTab === "series" && (
                  <SeriesResultTable
                    rows={rows}
                    onRowsChange={syncRowsAndSeries}
                  />
                )}

                {activeTab === "chart" && (
                  <ChartPanel
                    rows={detailRows}
                    series={series}
                    loading={loading}
                    onToggleSeries={(id: string, visible: boolean) => {
                      // update series state passed from parent
                      onSeriesChange(
                        series.map((item) =>
                          item.id === id ? { ...item, visible } : item,
                        ),
                      );

                      // sync result rows checkboxes
                      onRowsChange(
                        rows.map((r) => (r.id === id ? { ...r, visible } : r)),
                      );
                    }}
                  />
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
