import { type JimuMapView, loadArcGISJSAPIModules } from "jimu-arcgis";
import { useEffect, useRef } from "react";

import type { DetailRow } from "../types";

type Props = {
  jimuMapView?: JimuMapView | null;
  rows: DetailRow[];
  loading?: boolean;
};

const POZOS_LAYER_URL =
  "https://services8.arcgis.com/ooZ6ebRuTSh0HnTQ/arcgis/rest/services/WL_PIEZOMETROS_GEOTECNIA/FeatureServer/0";

function escapeSqlText(value: string): string {
  return value.replace(/'/g, "''");
}

function getPozosUnicos(rows: DetailRow[]): string[] {
  const parts = rows
    .map((row) => String(row.POZO ?? "").trim())
    .filter((value) => value !== "")
    .flatMap((value) =>
      // Manejar cadenas que contienen varios pozos separados por comas, punto y coma, barras o pipes
      value.split(/[,;\/|]+/).map((v) => v.trim()),
    )
    .filter((v) => v !== "");

  return Array.from(new Set(parts));
}

function buildPozosWhere(pozos: string[]): string {
  if (!pozos.length) return "1=2";

  const values = pozos.map((pozo) => `'${escapeSqlText(pozo)}'`);

  return values.length === 1
    ? `POZO = ${values[0]}`
    : `POZO IN (${values.join(",")})`;
}

function formatValue(value: unknown, decimals = 3): string {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(decimals) : "—";
}

function formatDate(value: unknown): string {
  if (!value) return "—";

  const date = new Date(value as any);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("es-CL");
}

function getLatestRowByPozo(rows: DetailRow[]) {
  const map = new Map<string, DetailRow>();

  rows.forEach((row) => {
    const pozo = String(row.POZO ?? "").trim();
    if (!pozo) return;

    const current = map.get(pozo);

    if (!current) {
      map.set(pozo, row);
      return;
    }

    const currentDate = new Date(current.FECHA_HORA ?? current.FECHA).getTime();

    const nextDate = new Date(row.FECHA_HORA ?? row.FECHA).getTime();

    if (nextDate > currentDate) {
      map.set(pozo, row);
    }
  });

  return map;
}

function buildPopupHtml(attrs: any, lastRow?: DetailRow): string {
  return `
    <div style="font-family: Arial, sans-serif; min-width:280px;">
      <div style="font-size:16px;font-weight:800;color:#102a43;margin-bottom:8px;">
        ${attrs.POZO ?? "Pozo"}
      </div>

      <div style="background:#eef2ff;color:#1d4ed8;display:inline-block;padding:4px 8px;border-radius:999px;font-size:12px;font-weight:800;margin-bottom:10px;">
        ${attrs.SECTOR_GRUPO ?? "—"} / ${attrs.SECTOR_BASE ?? "—"}
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tbody>
          <tr>
            <td style="padding:6px;border-bottom:1px solid #e5e7eb;font-weight:700;">Campaña</td>
            <td style="padding:6px;border-bottom:1px solid #e5e7eb;">${lastRow?.CAMPANA ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding:6px;border-bottom:1px solid #e5e7eb;font-weight:700;">Pozo</td>
            <td style="padding:6px;border-bottom:1px solid #e5e7eb;">${lastRow?.POZO ?? attrs.POZO ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding:6px;border-bottom:1px solid #e5e7eb;font-weight:700;">Sensor último</td>
            <td style="padding:6px;border-bottom:1px solid #e5e7eb;">${lastRow?.SENSOR ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding:6px;border-bottom:1px solid #e5e7eb;font-weight:700;">Última lectura</td>
            <td style="padding:6px;border-bottom:1px solid #e5e7eb;">
              Fecha: ${formatDate(lastRow?.FECHA ?? lastRow?.FECHA_HORA)}<br/>
              Elevación: ${formatValue(lastRow?.ELEVACION)}<br/>
              Cota collar: ${formatValue(lastRow?.COTA_COLLAR)}<br/>
              Temperatura: ${formatValue(lastRow?.TEMPERATURA)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function getPointSymbol(pulse = false): any {
  return {
    type: "simple-marker",
    style: "circle",
    color: pulse ? [0, 255, 255, 0.95] : [255, 64, 64, 0.95],
    size: pulse ? 30 : 18,
    outline: {
      color: [0, 0, 0, 1],
      width: pulse ? 4 : 3,
    },
  };
}

export default function MapHighlighter({
  jimuMapView,
  rows,
  loading = false,
}: Props) {
  const graphicsLayerRef = useRef<any>(null);
  const pulseTimerRef = useRef<number | null>(null);
  const latestGraphicsRef = useRef<any[]>([]);
  const runIdRef = useRef<number>(0);

  useEffect(() => {
    let alive = true;
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    const clearPulse = () => {
      if (pulseTimerRef.current) {
        window.clearInterval(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
    };

    const run = async () => {
      if (loading) {
        console.log("MapHighlighter: esperando fin de consulta detalle...");
        return;
      }

      if (!jimuMapView?.view) {
        console.log("MapHighlighter: esperando JimuMapView...");
        return;
      }

      const pozosUnicos = getPozosUnicos(rows);

      if (!pozosUnicos.length) {
        console.log("MapHighlighter: sin pozos para mapear.");
        clearPulse();

        if (graphicsLayerRef.current) {
          graphicsLayerRef.current.removeAll();
        }

        return;
      }

      const view = jimuMapView.view;

      await view.when();

      if (!alive || runId !== runIdRef.current) return;

      const [GraphicsLayer, FeatureLayer, Graphic] =
        await loadArcGISJSAPIModules([
          "esri/layers/GraphicsLayer",
          "esri/layers/FeatureLayer",
          "esri/Graphic",
        ]);

      if (!alive || runId !== runIdRef.current) return;

      if (!graphicsLayerRef.current) {
        graphicsLayerRef.current = new GraphicsLayer({
          title: "Pozos seleccionados",
          listMode: "hide",
        });

        view.map.add(graphicsLayerRef.current);
      }

      const graphicsLayer = graphicsLayerRef.current;

      clearPulse();
      graphicsLayer.removeAll();
      latestGraphicsRef.current = [];

      const where = buildPozosWhere(pozosUnicos);
      console.log("MapHighlighter WHERE final:", where);
      const latestMap = getLatestRowByPozo(rows);

      console.log("POZOS únicos desde detalle:", pozosUnicos);
      console.log("WHERE MAPA POZOS:", where);

      const pozosLayer = new FeatureLayer({
        url: POZOS_LAYER_URL,
        outFields: ["*"],
      });

      await pozosLayer.load();

      if (!alive || runId !== runIdRef.current) return;

      const result = await pozosLayer.queryFeatures({
        where,
        outFields: ["*"],
        returnGeometry: true,
        outSpatialReference: { wkid: 4326 },
        outSR: 4326,
      });

      if (!alive || runId !== runIdRef.current) return;

      console.log("Features pozos RAW:", result.features.length);

      const uniqueByPozo = new Map<string, any>();

      result.features.forEach((feature: any) => {
        const pozo = String(feature.attributes?.POZO ?? "").trim();

        if (!pozo || !feature.geometry) return;

        if (!uniqueByPozo.has(pozo)) {
          uniqueByPozo.set(pozo, feature);
        }
      });

      const uniqueFeatures = Array.from(uniqueByPozo.values());

      console.log("Pozos únicos mapa:", uniqueFeatures.length);

      const graphics = uniqueFeatures
        .map((feature: any) => {
          const attrs = feature.attributes;
          const pozo = String(attrs.POZO ?? "").trim();
          const lastRow = latestMap.get(pozo);

          const geom = feature.geometry;

          if (!geom) return null;

          return new Graphic({
            geometry: geom,
            attributes: {
              ...attrs,
              __LAST_FECHA: lastRow?.FECHA ?? lastRow?.FECHA_HORA ?? null,
              __LAST_ELEVACION: lastRow?.ELEVACION ?? null,
              __LAST_COTA_COLLAR: lastRow?.COTA_COLLAR ?? null,
              __LAST_SENSOR: lastRow?.SENSOR ?? null,
            },
            symbol: getPointSymbol(false),
            popupTemplate: {
              title: "{POZO}",
              content: buildPopupHtml(attrs, lastRow),
            },
          });
        })
        .filter((g: any) => g !== null);

      if (!graphics.length) {
        console.warn("MapHighlighter: no hay gráficos válidos.");
        return;
      }

      graphicsLayer.addMany(graphics);
      latestGraphicsRef.current = graphics;

      view.map.layers.reorder(graphicsLayer, view.map.layers.length - 1);

      if (graphics.length === 1) {
        await view.goTo(
          {
            target: graphics,
            zoom: 14,
          },
          {
            duration: 900,
            easing: "ease-in-out",
          },
        );
      } else {
        // Para múltiples gráficos, calcular una extensión con padding y hacer zoom a ella
        const xs = graphics
          .map((g: any) => g.geometry?.longitude ?? g.geometry?.x)
          .filter((v: any) => Number.isFinite(Number(v)))
          .map((v: any) => Number(v));

        const ys = graphics
          .map((g: any) => g.geometry?.latitude ?? g.geometry?.y)
          .filter((v: any) => Number.isFinite(Number(v)))
          .map((v: any) => Number(v));

        if (xs.length > 0 && ys.length > 0) {
          const xmin = Math.min(...xs);
          const xmax = Math.max(...xs);
          const ymin = Math.min(...ys);
          const ymax = Math.max(...ys);

          const paddingFactor = 0.02; // 2% padding

          const paddingX = Math.max((xmax - xmin) * paddingFactor, 0.001);
          const paddingY = Math.max((ymax - ymin) * paddingFactor, 0.001);

          const [Extent] = await loadArcGISJSAPIModules([
            "esri/geometry/Extent",
          ]);

          const extent = new Extent({
            xmin: xmin - paddingX,
            ymin: ymin - paddingY,
            xmax: xmax + paddingX,
            ymax: ymax + paddingY,
            spatialReference: { wkid: 4326 },
          });

          await view.goTo(extent, {
            duration: 900,
            easing: "ease-in-out",
          });
        } else {
          // Fallback: usar goTo con target
          await view.goTo(
            {
              target: graphics,
            },
            {
              duration: 900,
              easing: "ease-in-out",
            },
          );
        }
      }

      let pulse = false;

      pulseTimerRef.current = window.setInterval(() => {
        pulse = !pulse;

        latestGraphicsRef.current.forEach((graphic) => {
          graphic.symbol = getPointSymbol(pulse);
        });
      }, 750);
    };

    run().catch((error) => {
      console.error("MapHighlighter error:", error);
    });

    return () => {
      alive = false;
    };
  }, [jimuMapView, rows, loading]);

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) {
        window.clearInterval(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }

      if (graphicsLayerRef.current) {
        graphicsLayerRef.current.removeAll();
      }
    };
  }, []);

  return null;
}
