import Plotly from "plotly.js-dist-min";
import { useEffect, useMemo, useRef } from "react";
import { DetailRow, SeriesSummary } from "../types";
import {
  buildPlotConfig,
  buildPlotLayout,
  buildPlotTraces,
} from "../utils/chart";
declare global {
  interface Window {
    Plotly?: any;
    define?: any;
  }
}

type Props = {
  rows: DetailRow[];
  series: SeriesSummary[];
  loading?: boolean;
  onToggleSeries?: (id: string, visible: boolean) => void;
};

export function ChartPanel(props: Props) {
  const { rows, series, loading = false } = props;
  const chartRef = useRef<HTMLDivElement | null>(null);

  const traces = useMemo(() => {
    return buildPlotTraces(rows, series);
  }, [rows, series]);

  useEffect(() => {
    let alive = true;

    const renderChart = async () => {
      if (!chartRef.current) return;
      if (loading) return;

      if (!rows.length || !traces.length) {
        if (window.Plotly && chartRef.current) {
          window.Plotly.purge(chartRef.current);
        }
        return;
      }

      if (!alive || !chartRef.current) return;

      await Plotly.react(
        chartRef.current,
        traces,
        buildPlotLayout(),
        buildPlotConfig(),
      );
      // ensure correct layout after render
      try {
        if (window.Plotly && chartRef.current && window.Plotly.Plots?.resize) {
          window.Plotly.Plots.resize(chartRef.current);
        }
      } catch (e) {
        // ignore
      }
    };

    renderChart().catch((error) => {
      console.error("Error renderizando gráfico Plotly:", error);
    });

    return () => {
      alive = false;
    };
  }, [rows, traces, loading]);

  // sync legend clicks with parent series state
  useEffect(() => {
    if (!chartRef.current || !window.Plotly || !props.onToggleSeries) return;

    const plot = chartRef.current as any;

    const handler = (ev: any) => {
      try {
        const curve = ev.curveNumber;
        const trace = plot.data?.[curve];
        const seriesId = trace?.meta?.id;
        if (!seriesId) return false;

        const s = props.series.find((it) => it.id === seriesId);
        const nextVisible = !(s?.visible ?? true);

        props.onToggleSeries(seriesId, nextVisible);
        return false;
      } catch (err) {
        return true;
      }
    };

    try {
      plot.on("plotly_legendclick", handler);
    } catch (e) {}

    return () => {
      try {
        plot.removeListener &&
          plot.removeListener("plotly_legendclick", handler);
      } catch (e) {}
    };
  }, [chartRef.current, props.series, props.onToggleSeries]);

  useEffect(() => {
    if (!chartRef.current) return;

    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => {
        if (window.Plotly && chartRef.current && window.Plotly.Plots?.resize) {
          try {
            window.Plotly.Plots.resize(chartRef.current);
          } catch (err) {
            // ignore
          }
        }
      });
      ro.observe(chartRef.current);
    } catch (err) {
      // ResizeObserver not available
    }

    return () => {
      if (ro && chartRef.current) {
        try {
          ro.unobserve(chartRef.current);
        } catch (e) {}
      }
      ro = null;
    };
  }, [chartRef.current]);

  useEffect(() => {
    return () => {
      if (window.Plotly && chartRef.current) {
        window.Plotly.purge(chartRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          marginTop: 18,
          height: 980,
          border: "2px dashed #cbd5e1",
          borderRadius: 14,
          background: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
        }}
      >
        Consultando detalle...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div
        style={{
          marginTop: 18,
          height: 800,
          border: "2px dashed #cbd5e1",
          borderRadius: 14,
          background: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
        }}
      >
        Aplica filtros para consultar detalle y generar el hidrograma.
      </div>
    );
  }

  if (!traces.length) {
    return (
      <div
        style={{
          marginTop: 18,
          height: 800,
          border: "2px dashed #cbd5e1",
          borderRadius: 14,
          background: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
        }}
      >
        No hay series visibles para graficar.
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 18,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 10,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        ref={chartRef}
        style={{
          width: "100%",
          height: 980,
        }}
      />
    </div>
  );
}
