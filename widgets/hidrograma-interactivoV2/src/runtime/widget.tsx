import { JimuMapViewComponent, type JimuMapView } from "jimu-arcgis";
import { React, type AllWidgetProps } from "jimu-core";
import type { IMConfig } from "../config";

import { Collapsible, PanelConTarjetas } from "./components";
import { FilterPanel } from "./components/FilterPanel";
import MapHighlighter from "./components/MapHighlighter";
import ResultPanel from "./components/ResultPanel";
import type { ResultSerieRow } from "./components/SeriesResultTable";

import { EMPTY_DATE_RANGE, EMPTY_FILTERS } from "./constants";
import { queryDetailRows } from "./services/detailService";
import { queryAllSummaryRows } from "./services/summaryService";

import type {
  DateRangeState,
  DetailRow,
  FilterState,
  SeriesSummary,
  SummaryRow,
} from "./types";

import { buildSeriesSummaries } from "./utils/series";
import { buildDetailWhere, validateDetailQuery } from "./utils/where";

const style = document.createElement("style");
style.innerHTML = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`;
document.head.appendChild(style);

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const [summaryRows, setSummaryRows] = React.useState<SummaryRow[]>([]);

  const [filters, setFilters] = React.useState<FilterState>({
    ...EMPTY_FILTERS,
  });

  const [dateRange, setDateRange] = React.useState<DateRangeState>({
    ...EMPTY_DATE_RANGE,
  });

  const [detailRows, setDetailRows] = React.useState<DetailRow[]>([]);
  const [series, setSeries] = React.useState<SeriesSummary[]>([]);
  const [resultRows, setResultRows] = React.useState<ResultSerieRow[]>([]);
  const [resultOpen, setResultOpen] = React.useState<boolean>(false);

  const [jimuMapView, setJimuMapView] = React.useState<JimuMapView | null>(
    null,
  );

  const [loadingSummary, setLoadingSummary] = React.useState<boolean>(false);
  const [summaryError, setSummaryError] = React.useState<string | null>(null);

  const [loadingDetail, setLoadingDetail] = React.useState<boolean>(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  const [panelOpen, setPanelOpen] = React.useState<boolean>(true);

  React.useEffect(() => {
    let alive = true;

    const init = async () => {
      try {
        setLoadingSummary(true);
        setSummaryError(null);

        const rows = await queryAllSummaryRows();

        if (!alive) return;

        setSummaryRows(rows);

        console.log(
          `Tabla resumen cargada: ${rows.length.toLocaleString(
            "es-CL",
          )} combinaciones disponibles.`,
        );
      } catch (err) {
        console.error("Error cargando tabla resumen:", err);

        if (!alive) return;

        setSummaryError(
          err instanceof Error
            ? err.message
            : "No fue posible cargar la tabla resumen HIDROGRAMA_FILTROS.",
        );
      } finally {
        if (alive) {
          setLoadingSummary(false);
        }
      }
    };

    init();

    return () => {
      alive = false;
    };
  }, []);

  const activeViewChangeHandler = (jimuMapView: JimuMapView) => {
    console.log("JimuMapView cargado:", jimuMapView);
    setJimuMapView(jimuMapView);
  };

  const handleApplyFilters = async (payload: {
    filters: FilterState;
    dateRange: DateRangeState;
    rows: SummaryRow[];
    where?: string;
  }) => {
    const errors = validateDetailQuery(payload.filters, payload.dateRange);

    if (errors.length > 0) {
      setDetailError(errors.join(" "));
      setDetailRows([]);
      setSeries([]);
      setResultRows([]);
      setResultOpen(true);
      return;
    }

    const where = buildDetailWhere(payload.filters, payload.dateRange);

    try {
      setLoadingDetail(true);
      // Colapsar panel de filtros apenas inicia la carga
      setPanelOpen(false);
      setDetailError(null);
      setDetailRows([]);
      setSeries([]);
      setResultRows([]);
      setResultOpen(true);

      const rows = await queryDetailRows(where);
      const nextSeries = buildSeriesSummaries(rows);

      console.log("WHERE detalle:", where);
      console.log("Registros detalle:", rows.length);
      console.log("Series generadas:", nextSeries.length);
      console.log("Series:", nextSeries);

      setDetailRows(rows);
      setSeries(nextSeries);

      setResultRows(
        nextSeries.map((item) => ({
          id: item.id,
          serie: item.serie || item.label || item.id,
          tipo: item.tipo,
          ultimoValor: item.ultimoValor,
          fechaUltimoRegistro: item.fechaUltimoRegistro,
          visible: item.visible,
        })),
      );
    } catch (err) {
      console.error("Error consultando detalle:", err);

      setDetailRows([]);
      setSeries([]);
      setResultRows([]);

      setDetailError(
        err instanceof Error
          ? err.message
          : "Error desconocido consultando tabla detalle.",
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const isLoading = loadingSummary || loadingDetail;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <div style={{ pointerEvents: "auto" }}>
        <PanelConTarjetas>
          <Collapsible
            open={panelOpen}
            title="Hidrograma tools"
            onToggle={() => setPanelOpen((prev) => !prev)}
          >
            <div style={{ padding: 12 }}>
              {loadingSummary && (
                <div
                  style={{
                    marginBottom: 12,
                    color: "#486581",
                    fontWeight: 700,
                  }}
                >
                  Cargando tabla resumen...
                </div>
              )}

              {summaryError && (
                <div
                  style={{
                    color: "#b42318",
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  {summaryError}
                </div>
              )}

              <FilterPanel
                rows={summaryRows}
                filters={filters}
                dateRange={dateRange}
                loading={loadingSummary || loadingDetail}
                onFiltersChange={setFilters}
                onDateRangeChange={setDateRange}
                onApply={handleApplyFilters}
              />

              {props.useMapWidgetIds?.length > 0 && (
                <JimuMapViewComponent
                  useMapWidgetId={props.useMapWidgetIds[0]}
                  onActiveViewChange={activeViewChangeHandler}
                />
              )}
              {/* MapHighlighter se monta a nivel de widget para sincronizar con la vista y filas de detalle */}
              <MapHighlighter
                jimuMapView={jimuMapView}
                rows={detailRows}
                loading={loadingDetail}
              />
            </div>
          </Collapsible>

          {isLoading && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(255,255,255,0.6)",
                backdropFilter: "blur(4px)",
                zIndex: 11000,
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  padding: "28px 36px",
                  borderRadius: 16,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                  textAlign: "center",
                  minWidth: 260,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    border: "4px solid #d9e2ec",
                    borderTop: "4px solid #1f5da8",
                    borderRadius: "50%",
                    margin: "0 auto 16px auto",
                    animation: "spin 1s linear infinite",
                  }}
                />

                <div style={{ fontWeight: 800, color: "#102a43" }}>
                  Aplicando filtros
                </div>

                <div style={{ fontSize: 13, color: "#627d98", marginTop: 6 }}>
                  Consultando datos y preparando hidrograma...
                </div>
              </div>
            </div>
          )}
          <div style={{ pointerEvents: "auto" }}>
            <ResultPanel
              open={resultOpen}
              rows={resultRows}
              detailRows={detailRows}
              series={series}
              loading={loadingDetail}
              error={detailError}
              onRowsChange={setResultRows}
              onSeriesChange={setSeries}
              onClose={() => setResultOpen(false)}
            />
          </div>
        </PanelConTarjetas>
      </div>
    </div>
  );
};

export default Widget;
