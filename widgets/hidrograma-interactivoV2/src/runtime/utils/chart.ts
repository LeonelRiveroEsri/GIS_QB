import type { Config, Data, Layout } from "plotly.js";
import type { DetailRow, SeriesSummary } from "../types";

function getDateValue(value: unknown): Date | null {
  if (!value) return null;

  const date = new Date(value as any);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getYValue(row: DetailRow, tipo: string): number | null {
  const value = tipo === "COTA_COLLAR" ? row.COTA_COLLAR : row.ELEVACION;

  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? null : numberValue;
}

export function buildPlotTraces(
  rows: DetailRow[],
  series: SeriesSummary[],
): Data[] {
  const visibleSeries = series.filter((item) => item.visible);

  return visibleSeries.map((serie) => {
    if (serie.tipo === "COTA_COLLAR") {
      // Aggregate by POZO (ignore sensor) and average values per date
      const filasPozo = rows.filter((row) => row.POZO === serie.pozo);

      const agrupado: Record<string, number[]> = {};
      filasPozo.forEach((row) => {
        const rawFecha = row.FECHA_HORA ?? row.FECHA;
        const fecha = getDateValue(rawFecha);
        if (!fecha) return;
        const y = getYValue(row, "COTA_COLLAR");
        if (y === null) return;
        const key = fecha.toISOString();
        if (!agrupado[key]) agrupado[key] = [];
        agrupado[key].push(y);
      });

      const fechasIso = Object.keys(agrupado).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
      });

      const fechas = fechasIso.map((s) => new Date(s));

      const yVals = fechasIso.map((iso) => {
        const arr = agrupado[iso];
        if (!arr || arr.length === 0) return null;
        const sum = arr.reduce((acc, v) => acc + v, 0);
        return sum / arr.length;
      });

      return {
        type: "scatter",
        mode: "lines",
        name: serie.serie || serie.label || serie.id,
        meta: { id: serie.id },
        x: fechas,
        y: yVals,
        line: {
          width: 2,
          dash: "dash",
        },
        marker: { size: 0 },
        hovertemplate:
          "<b>%{fullData.name}</b><br>" +
          "Fecha: %{x|%d-%m-%Y}<br>" +
          "Cota collar: %{y:.3f}<extra></extra>",
      } as Data;
    }

    const serieRows = rows
      .filter((row) => row.POZO === serie.pozo && row.SENSOR === serie.sensor)
      .map((row) => {
        const x = getDateValue(row.FECHA_HORA ?? row.FECHA);
        const y = getYValue(row, serie.tipo);

        return { x, y };
      })
      .filter((item) => item.x !== null && item.y !== null)
      .sort((a, b) => {
        return (a.x as Date).getTime() - (b.x as Date).getTime();
      });

    return {
      type: "scattergl",
      mode: "lines+markers",
      name: serie.serie || serie.label || serie.id,
      meta: { id: serie.id },
      x: serieRows.map((item) => item.x),
      y: serieRows.map((item) => item.y),
      line: {
        width: 2,
        dash: "solid",
      },
      marker: {
        size: 6,
      },
      hovertemplate:
        "<b>%{fullData.name}</b><br>" +
        "Fecha: %{x|%d-%m-%Y}<br>" +
        "Elevación: %{y:.3f}<extra></extra>",
    } as Data;
  });
}

export function buildPlotLayout(): Partial<Layout> {
  return {
    autosize: true,
    margin: {
      l: 60,
      r: 30,
      t: 60,
      b: 80,
    },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    hovermode: "x unified",
    showlegend: true,
    legend: {
      orientation: "h",
      x: 0,
      y: 1.12,
      xanchor: "left",
      yanchor: "bottom",
    },
    xaxis: {
      title: {
        text: "Fecha",
      },
      type: "date",
      rangeslider: {
        visible: true,
        thickness: 0.07,
        bgcolor: "#f1f5f9",
        bordercolor: "#e2e8f0",
        borderwidth: 1,
      },
      rangeselector: {
        buttons: [
          { count: 7, label: "7d", step: "day", stepmode: "backward" },
          { count: 1, label: "1m", step: "month", stepmode: "backward" },
          { count: 3, label: "3m", step: "month", stepmode: "backward" },
          { step: "all", label: "Todo" },
        ],
      },
    },
    yaxis: {
      title: {
        text: "Valor",
      },
      tickformat: ".3f",
      zeroline: false,
    },
    annotations: [],
  };
}

export function buildPlotConfig(): Partial<Config> {
  return {
    responsive: true,
    displaylogo: false,
    scrollZoom: true,
    modeBarButtonsToRemove: [
      "lasso2d",
      "select2d",
      "autoScale2d",
      "toggleSpikelines",
    ],
  };
}
