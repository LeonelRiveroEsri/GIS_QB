import type { DetailRow, SeriesSummary } from "../types";

export type PlotTrace = {
  x: Array<string | number | Date>;
  y: Array<number | null>;
  name: string;
  mode: string;
  type: string;
  line?: {
    dash?: string;
    width?: number;
  };
  marker?: {
    size?: number;
  };
  hovertemplate?: string;
};

function getSerieId(row: DetailRow, tipo: "ELEVACION" | "COTA_COLLAR"): string {
  const pozo = row.POZO ?? "";
  const sensor = row.SENSOR ?? "";
  return `${pozo}|${sensor}|${tipo}`;
}

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value as any);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function buildPlotTraces(
  rows: DetailRow[],
  series: SeriesSummary[],
): PlotTrace[] {
  const visibleSeries = new Set(
    series.filter((item) => item.visible).map((item) => item.id),
  );

  // We will create two kinds of groups:
  // - Elevacion per POZO|SENSOR|ELEVACION (unchanged)
  // - Collar aggregated per POZO (ignore sensor), average value per date

  const elevGroups = new Map<string, DetailRow[]>();
  const collarByPozo: Record<string, Record<string, number[]>> = {};

  rows.forEach((row) => {
    const elevId = getSerieId(row, "ELEVACION");
    if (visibleSeries.has(elevId)) {
      if (!elevGroups.has(elevId)) elevGroups.set(elevId, []);
      elevGroups.get(elevId)!.push(row);
    }

    // For collar we group by POZO (no sensor). The series key for collar
    // summaries is `${pozo}||COTA_COLLAR` so check that instead of the
    // sensor-specific id returned by getSerieId.
    const pozo = row.POZO ?? "";
    const collarGroupId = `${pozo}||COTA_COLLAR`;

    if (
      visibleSeries.has(collarGroupId) &&
      row.COTA_COLLAR !== null &&
      row.COTA_COLLAR !== undefined
    ) {
      const pozo = row.POZO ?? "";
      const fecha = parseDate(row.FECHA_HORA ?? row.FECHA);
      if (!fecha) return;
      const key = fecha.toISOString();
      collarByPozo[pozo] = collarByPozo[pozo] || {};
      collarByPozo[pozo][key] = collarByPozo[pozo][key] || [];
      collarByPozo[pozo][key].push(Number(row.COTA_COLLAR));
    }
  });

  const traces: PlotTrace[] = [];

  // Elevation traces (per sensor)
  elevGroups.forEach((items, serieId) => {
    const [pozo, sensor] = serieId.split("|");
    const sorted = [...items].sort((a, b) => {
      const da = parseDate(a.FECHA_HORA ?? a.FECHA)?.getTime() ?? 0;
      const db = parseDate(b.FECHA_HORA ?? b.FECHA)?.getTime() ?? 0;
      return da - db;
    });

    traces.push({
      x: sorted.map((row) => parseDate(row.FECHA_HORA ?? row.FECHA) ?? ""),
      y: sorted.map((row) => Number(row.ELEVACION ?? null)),
      name: `${pozo} | ${sensor} - ELEVACION`,
      meta: { id: `${pozo}|${sensor}|ELEVACION` },
      mode: "lines+markers",
      type: "scatter",
      line: { dash: "solid", width: 2 },
      marker: { size: 5 },
      hovertemplate:
        `<b>${pozo} | ${sensor} - ELEVACION</b><br>` +
        `Fecha: %{x|%Y-%m-%d}<br>` +
        `Elevación: %{y:.3f}<extra></extra>`,
    });
  });

  // Collar traces aggregated per POZO (average per date)
  Object.keys(collarByPozo).forEach((pozo) => {
    const fechasIso = Object.keys(collarByPozo[pozo]).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );
    const fechas = fechasIso.map((s) => new Date(s));
    const yVals = fechasIso.map((iso) => {
      const arr = collarByPozo[pozo][iso] || [];
      if (!arr.length) return null;
      const sum = arr.reduce((acc, v) => acc + v, 0);
      return sum / arr.length;
    });

    traces.push({
      x: fechas,
      y: yVals,
      name: `${pozo} - COTA_COLLAR`,
      meta: { id: `${pozo}||COTA_COLLAR` },
      mode: "lines",
      type: "scatter",
      line: { dash: "dash", width: 2 },
      marker: { size: 0 },
      hovertemplate:
        `<b>${pozo} - COTA_COLLAR</b><br>` +
        `Fecha: %{x|%Y-%m-%d}<br>` +
        `Cota collar: %{y:.3f}<extra></extra>`,
    });
  });

  return traces;
}

export function buildPlotLayout() {
  return {
    title: {
      text: "ELEVACION y COTA_COLLAR por FECHA",
      font: {
        size: 22,
        color: "#1f2937",
      },
      x: 0.5,
      xanchor: "center",
    },

    xaxis: {
      title: {
        text: "FECHA",
        font: { size: 16, color: "#1f2937" },
      },
      type: "date",
      showgrid: true,
      gridcolor: "#e5e7eb",
      zeroline: false,

      rangeselector: {
        x: 0,
        y: 1.08,
        xanchor: "left",
        yanchor: "top",
        bgcolor: "#f3f4f6",
        activecolor: "#2563eb",
        bordercolor: "#d1d5db",
        borderwidth: 1,
        font: {
          size: 12,
          color: "#111827",
        },
        buttons: [
          {
            count: 7,
            label: "7 días",
            step: "day",
            stepmode: "backward",
          },
          {
            count: 1,
            label: "1 mes",
            step: "month",
            stepmode: "backward",
          },
          {
            count: 3,
            label: "3 meses",
            step: "month",
            stepmode: "backward",
          },
          {
            count: 6,
            label: "6 meses",
            step: "month",
            stepmode: "backward",
          },
          {
            step: "all",
            label: "Todo",
          },
        ],
      },

      rangeslider: {
        visible: true,
        thickness: 0.12,
        bgcolor: "#9ca3af",
        bordercolor: "#6b7280",
        borderwidth: 1,
      },
    },

    yaxis: {
      title: {
        text: "Valor",
        font: { size: 16, color: "#1f2937" },
      },
      showgrid: true,
      gridcolor: "#e5e7eb",
      zeroline: false,
      fixedrange: false,
    },

    annotations: [
      {
        text: "<b>Vista General de la Serie</b>",
        xref: "paper",
        yref: "paper",
        x: 0,
        y: -0.23,
        showarrow: false,
        font: {
          size: 14,
          color: "#102a43",
        },
        align: "left",
      },
    ],

    hovermode: "x unified",
    dragmode: "pan",
    showlegend: false,

    margin: {
      l: 70,
      r: 40,
      t: 115,
      b: 150,
    },

    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
  };
}

export function buildPlotConfig() {
  return {
    responsive: true,
    displaylogo: false,
    scrollZoom: true,
    modeBarButtonsToRemove: ["lasso2d", "select2d"],
    toImageButtonOptions: {
      format: "png",
      filename: "hidrograma_interactivo",
      height: 980,
      width: 1600,
      scale: 2,
    },
  };
}
