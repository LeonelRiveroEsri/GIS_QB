import { SessionManager } from "jimu-core";
import { DetailRow } from "../types";

const DETAIL_TABLE_URL =
  "https://services8.arcgis.com/ooZ6ebRuTSh0HnTQ/arcgis/rest/services/WL_PIEZOMETROS_GEOTECNIA/FeatureServer/1";

export const DETAIL_OUT_FIELDS = [
  "OBJECTID",
  "CAMPANA",
  "FECHA",
  "HORA",
  "FECHA_HORA",
  "ELEVACION",
  "PROFUNDIDAD_SENSOR",
  "TEMPERATURA",
  "POZO",
  "SENSOR",
  "COTA_COLLAR",
  "ESTATUS",
  "OBS",
  "PIEZOMETRO_SENSOR",
  "SECTOR_GRUPO",
  "SECTOR_BASE",
  "DETALLE",
];

type ArcGISQueryResponse = {
  features?: Array<{ attributes: DetailRow }>;
  error?: {
    message?: string;
    details?: string[];
  };
};

async function getUserToken(): Promise<string> {
  const session = SessionManager.getInstance().getMainSession();

  if (!session) {
    throw new Error("No hay sesión activa de ArcGIS.");
  }

  const token = await session.getToken(DETAIL_TABLE_URL);

  if (!token) {
    throw new Error(
      "No se pudo obtener token para consultar la tabla detalle.",
    );
  }

  return token;
}

export async function queryDetailRows(where: string): Promise<DetailRow[]> {
  const token = await getUserToken();
  const pageSize = 2000;
  let offset = 0;
  const rows: DetailRow[] = [];

  while (true) {
    const params = new URLSearchParams({
      f: "json",
      where,
      outFields: DETAIL_OUT_FIELDS.join(","),
      returnGeometry: "false",
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
      orderByFields: "FECHA_HORA ASC",
      token,
    });

    const response = await fetch(
      `${DETAIL_TABLE_URL}/query?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(`Error HTTP consultando detalle: ${response.status}`);
    }

    const data = (await response.json()) as ArcGISQueryResponse;

    if (data.error) {
      throw new Error(
        `${data.error.message ?? "Error ArcGIS REST"} ${data.error.details?.join(" ") ?? ""}`,
      );
    }

    const features = data.features ?? [];

    if (features.length === 0) break;

    rows.push(...features.map((feature) => feature.attributes));

    if (features.length < pageSize) break;

    offset += pageSize;
  }

  return rows;
}
