import { loadArcGISJSAPIModules } from "jimu-arcgis";
import { SessionManager } from "jimu-core";
import proj4 from "proj4";
import { useEffect, useRef, useState } from "react";
import { DetailRow } from "../types";
import { buildPozosWhereFromDetailRows } from "../utils/mapWhere";

proj4.defs(
  "EPSG:32719",
  "+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs",
);

type Props = {
  rows: DetailRow[];
  loading?: boolean;
};

const WEBMAP_ID = "67a29111b44c421fb977f3f5f6a74074";

const PORTAL_URL = "https://teck-qb2.maps.arcgis.com";

const WEBMAP_ITEM_REST_URL = `${PORTAL_URL}/sharing/rest/content/items/${WEBMAP_ID}`;

const POZOS_LAYER_URL =
  "https://services8.arcgis.com/ooZ6ebRuTSh0HnTQ/arcgis/rest/services/WL_PIEZOMETROS_GEOTECNIA/FeatureServer/0";

function getValidNumber(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
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

function buildPopupHtml(attributes: any, lastRow?: DetailRow): string {
  return `
    <div style="font-family: Arial, sans-serif; min-width:280px;">
      <div style="font-size:16px;font-weight:800;color:#102a43;margin-bottom:8px;">
        ${attributes.POZO ?? "Pozo"}
      </div>

      <div style="background:#eef2ff;color:#1d4ed8;display:inline-block;padding:4px 8px;border-radius:999px;font-size:12px;font-weight:800;margin-bottom:10px;">
        ${attributes.SECTOR_GRUPO ?? "—"} / ${attributes.SECTOR_BASE ?? "—"}
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tbody>
          <tr>
            <td style="padding:6px;border-bottom:1px solid #e5e7eb;font-weight:700;">Campaña</td>
            <td style="padding:6px;border-bottom:1px solid #e5e7eb;">${lastRow?.CAMPANA ?? attributes.CAMPANA ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding:6px;border-bottom:1px solid #e5e7eb;font-weight:700;">Pozo</td>
            <td style="padding:6px;border-bottom:1px solid #e5e7eb;">${lastRow?.POZO ?? attributes.POZO ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding:6px;border-bottom:1px solid #e5e7eb;font-weight:700;">Sensor último</td>
            <td style="padding:6px;border-bottom:1px solid #e5e7eb;">${lastRow?.SENSOR ?? attributes.SENSOR ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding:6px;border-bottom:1px solid #e5e7eb;font-weight:700;">Última lectura</td>
            <td style="padding:6px;border-bottom:1px solid #e5e7eb;">
              Fecha: ${formatDate(lastRow?.FECHA ?? lastRow?.FECHA_HORA ?? attributes.FECHA ?? attributes.FECHA_HORA)}<br/>
              Elevación: ${formatValue(lastRow?.ELEVACION ?? attributes.ELEVACION)}<br/>
              Cota collar: ${formatValue(lastRow?.COTA_COLLAR ?? attributes.COTA_COLLAR)}<br/>
              Temperatura: ${formatValue(lastRow?.TEMPERATURA ?? attributes.TEMPERATURA)}
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
    color: pulse ? [255, 230, 0, 0.95] : [255, 64, 64, 0.95],
    size: pulse ? 28 : 18,
    outline: {
      color: [0, 0, 0, 1],
      width: pulse ? 4 : 3,
    },
  };
}
async function ensureArcGisSession() {
  const sessionManager = SessionManager.getInstance();

  let session = sessionManager.getMainSession();

  if (!session) {
    session = await sessionManager.signInByResourceUrl(
      WEBMAP_ITEM_REST_URL,
      PORTAL_URL,
      true,
    );
  }

  if (!session) {
    throw new Error(
      "No se pudo iniciar sesión en ArcGIS para cargar el WebMap.",
    );
  }

  return session;
}
export default function MapPanel({ rows, loading = false }: Props) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<any>(null);
  const graphicsLayerRef = useRef<any>(null);
  const pulseTimerRef = useRef<number | null>(null);
  const latestGraphicsRef = useRef<any[]>([]);
  const pozosFeatureLayerRef = useRef<any>(null);
  const [pozosCount, setPozosCount] = useState(0);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const initMap = async () => {
      try {
        setMapError(null);

        await ensureArcGisSession();

        const [WebMap, MapView, GraphicsLayer, esriConfig, Portal] =
          await loadArcGISJSAPIModules([
            "esri/WebMap",
            "esri/views/MapView",
            "esri/layers/GraphicsLayer",
            "esri/config",
            "esri/portal/Portal",
          ]);

        if (!alive || !mapDivRef.current) return;

        esriConfig.portalUrl = PORTAL_URL;

        const portal = new Portal({
          url: PORTAL_URL,
        });

        await portal.load();

        const webmap = new WebMap({
          portalItem: {
            id: WEBMAP_ID,
            portal,
          },
        });

        const graphicsLayer = new GraphicsLayer({
          title: "Pozos filtrados",
        });

        webmap.layers.add(graphicsLayer);
        webmap.layers.reorder(graphicsLayer, webmap.layers.length - 1);

        const view = new MapView({
          container: mapDivRef.current,
          map: webmap,
          popup: {
            dockEnabled: true,
            dockOptions: {
              position: "top-right",
              breakpoint: false,
            },
          },
          constraints: {
            snapToZoom: false,
          },
        });

        await view.when();

        if (!alive) {
          view.destroy();
          return;
        }

        viewRef.current = view;
        graphicsLayerRef.current = graphicsLayer;
      } catch (error) {
        console.error("Error inicializando mapa:", error);
        setMapError(
          error instanceof Error ? error.message : "Error inicializando mapa.",
        );
      }
    };

    initMap();

    return () => {
      alive = false;

      if (pulseTimerRef.current) {
        window.clearInterval(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }

      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      graphicsLayerRef.current = null;
      pozosFeatureLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const updateMap = async () => {
      if (!viewRef.current || !graphicsLayerRef.current) return;

      if (pulseTimerRef.current) {
        window.clearInterval(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }

      const view = viewRef.current;
      const graphicsLayer = graphicsLayerRef.current;

      graphicsLayer.removeAll();
      latestGraphicsRef.current = [];
      setPozosCount(0);
      setMapError(null);

      if (!rows.length) return;

      try {
        const where = buildPozosWhereFromDetailRows(rows);

        console.log("WHERE aplicado al mapa:", where);

        const [FeatureLayer, Graphic, Point, Extent] =
          await loadArcGISJSAPIModules([
            "esri/layers/FeatureLayer",
            "esri/Graphic",
            "esri/geometry/Point",
            "esri/geometry/Extent",
          ]);

        let pozosLayer = pozosFeatureLayerRef.current;

        if (!pozosLayer) {
          pozosLayer = new FeatureLayer({
            url: POZOS_LAYER_URL,
            title: "Piezómetros geotecnia",
            outFields: ["*"],
            visible: true,
          });

          view.map.layers.add(pozosLayer);
          view.map.layers.reorder(pozosLayer, view.map.layers.length - 2);
          view.map.layers.reorder(graphicsLayer, view.map.layers.length - 1);
          pozosFeatureLayerRef.current = pozosLayer;
        }

        pozosLayer.definitionExpression = where;

        const result = await pozosLayer.queryFeatures({
          where,
          outFields: ["*"],
          returnGeometry: false,
        });

        console.log("Features pozos RAW:", result.features.length);

        const uniqueByPozo = new Map<string, any>();

        result.features.forEach((feature: any) => {
          const pozo = String(feature.attributes.POZO ?? "").trim();

          if (!pozo) return;

          if (!uniqueByPozo.has(pozo)) {
            uniqueByPozo.set(pozo, feature);
          }
        });

        const uniqueFeatures = Array.from(uniqueByPozo.values());

        const latestMap = getLatestRowByPozo(rows);

        console.log("Pozos únicos mapa:", uniqueFeatures.length);

        const graphics = uniqueFeatures
          .map((feature: any) => {
            const attrs = feature.attributes;

            const x = getValidNumber(attrs.X_COLLAR ?? attrs.X_SENSOR);
            const y = getValidNumber(attrs.Y_COLLAR ?? attrs.Y_SENSOR);

            if (x === null || y === null) return null;

            const [lon, lat] = proj4("EPSG:32719", "EPSG:4326", [x, y]);

            const point = new Point({
              longitude: lon,
              latitude: lat,
              spatialReference: { wkid: 4326 },
            });

            const lastRow = latestMap.get(String(attrs.POZO ?? "").trim());

            return new Graphic({
              geometry: point,
              attributes: attrs,
              symbol: getPointSymbol(false),
              popupTemplate: {
                title: "{POZO}",
                content: buildPopupHtml(attrs, lastRow),
              },
            });
          })
          .filter((graphic: any) => graphic !== null);

        if (!alive) return;

        graphicsLayer.addMany(graphics);

        view.map.layers.reorder(graphicsLayer, view.map.layers.length - 1);

        latestGraphicsRef.current = graphics;
        setPozosCount(graphics.length);

        if (graphics.length > 0) {
          const xs = graphics
            .map(
              (graphic: any) =>
                graphic.geometry?.longitude ?? graphic.geometry?.x,
            )
            .filter((value: any) => Number.isFinite(Number(value)))
            .map((value: any) => Number(value));

          const ys = graphics
            .map(
              (graphic: any) =>
                graphic.geometry?.latitude ?? graphic.geometry?.y,
            )
            .filter((value: any) => Number.isFinite(Number(value)))
            .map((value: any) => Number(value));

          if (xs.length > 0 && ys.length > 0) {
            const xmin = Math.min(...xs);
            const xmax = Math.max(...xs);
            const ymin = Math.min(...ys);
            const ymax = Math.max(...ys);

            const paddingFactor = 0.01; // 1%

            const paddingX = Math.max((xmax - xmin) * paddingFactor, 0.001);
            const paddingY = Math.max((ymax - ymin) * paddingFactor, 0.001);

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
          }
        }
        let pulse = false;

        pulseTimerRef.current = window.setInterval(() => {
          pulse = !pulse;

          latestGraphicsRef.current.forEach((graphic) => {
            graphic.symbol = getPointSymbol(pulse);
          });
        }, 750);
      } catch (error) {
        console.error("Error actualizando mapa:", error);
        setMapError(
          error instanceof Error ? error.message : "Error actualizando mapa.",
        );
      }
    };

    updateMap();

    return () => {
      alive = false;
    };
  }, [rows]);

  return (
    <div
      style={{
        marginTop: 20,
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        background: "#ffffff",
      }}
    >
      <div
        style={{
          padding: 12,
          background: "#f8fafc",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 800, color: "#102a43" }}>
            Mapa de pozos filtrados
          </div>
          <div style={{ fontSize: 13, color: "#627d98" }}>
            Pozos únicos destacados: {pozosCount.toLocaleString("es-CL")}
          </div>
        </div>

        <div
          style={{
            background: loading ? "#fff4df" : "#e5f7f3",
            color: loading ? "#d97706" : "#0f8b72",
            padding: "7px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          {loading ? "Actualizando mapa" : "Mapa listo"}
        </div>
      </div>

      {mapError && (
        <div
          style={{
            margin: 12,
            padding: 12,
            borderRadius: 12,
            background: "#fff1f0",
            color: "#b42318",
            border: "1px solid #ffd3cf",
            fontWeight: 800,
          }}
        >
          {mapError}
        </div>
      )}

      <div
        ref={mapDivRef}
        style={{
          width: "100%",
          height: 620,
          background: "#eef2f7",
        }}
      />
    </div>
  );
}
