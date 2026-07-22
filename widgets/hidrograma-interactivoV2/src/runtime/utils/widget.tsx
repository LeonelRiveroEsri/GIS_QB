import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import { AllWidgetProps } from "jimu-core";
import { useEffect, useMemo, useState } from "react";

import { FilterPanel } from "./components/FilterPanel";
import MapHighlighter from "./components/MapHighlighter";
import ResultPanel from "./components/ResultPanel";

import { EMPTY_FILTERS } from "./constants";
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

const Widget = (props: AllWidgetProps<Config>) => {
  // =========================
  // STATE
  // =========================
  const [summaryRows, setSummaryRows] = useState<SummaryRow[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS });

  const [dateRange, setDateRange] = useState<DateRangeState>({
    fechaInicio: "",
    fechaFin: "",
  });

  const [detailRows, setDetailRows] = useState<DetailRow[]>([]);
  const [series, setSeries] = useState<SeriesSummary[]>([]);
  const [panelOpen, setPanelOpen] = useState<boolean>(true);
  const [resultOpen, setResultOpen] = useState<boolean>(false);
  const [resultRows, setResultRows] = useState<ResultSerieRow[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // MAP
  const [jimuMapView, setJimuMapView] = useState<JimuMapView | null>(null);

  const activeViewChangeHandler = (view: JimuMapView) => {
    console.log("MAP READY");
    setJimuMapView(view);
  };

  // =========================
  // LOAD SUMMARY
  // =========================
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoadingSummary(true);

        const rows = await queryAllSummaryRows();

        if (!alive) return;

        setSummaryRows(rows);

        const range = getDateRangeFromRows(rows);

        setDateRange({
          fechaInicio: range.fechaMin,
          fechaFin: range.fechaMax,
        });
      } catch (e) {
        setSummaryError("Error cargando resumen");
      } finally {
        setLoadingSummary(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, []);

  // =========================
  // APPLY FILTERS
  // =========================
  const handleApply = async (payload: {
    filters: FilterState;
    dateRange: DateRangeState;
  }) => {
    const errors = validateDetailQuery(payload.filters, payload.dateRange);

    if (errors.length) {
      setDetailError(errors.join(" "));
      return;
    }

    const where = buildDetailWhere(payload.filters, payload.dateRange);

    try {
      setLoadingDetail(true);
      setDetailError(null);

      const rows = await queryDetailRows(where);

      const nextSeries = buildSeriesSummaries(rows);

      setDetailRows(rows);
      console.log("DETAIL ROWS SET PARA MAPA:", rows.length);
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

      setResultOpen(true);

      setResultOpen(true);
    } catch (e) {
      setDetailError("Error consultando detalle");
    } finally {
      setLoadingDetail(false);
    }
  };

  // =========================
  // MAP SYNC (CLAVE)
  // =========================
  const readyForMap = useMemo(() => {
    return jimuMapView && detailRows.length > 0 && !loadingDetail;
  }, [jimuMapView, detailRows, loadingDetail]);
  const isLoading = loadingSummary || loadingDetail;

  // =========================
  // UI
  // =========================
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        pointerEvents: "none",
      }}
    >
      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds?.[0]}
        onActiveViewChange={activeViewChangeHandler}
      />

      <MapHighlighter
        jimuMapView={jimuMapView}
        rows={detailRows}
        loading={loadingDetail}
      />

      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          pointerEvents: "auto",
        }}
      >
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
    </div>
  );
};

export default Widget;
