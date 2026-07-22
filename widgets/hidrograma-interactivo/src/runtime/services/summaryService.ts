import { SessionManager } from "jimu-core";
import { SUMMARY_OUT_FIELDS } from "../constants";
import { SummaryRow } from "../types";

const PORTAL_URL = "https://teck-qb2.maps.arcgis.com";

const SUMMARY_TABLE_URL =
  "https://services8.arcgis.com/ooZ6ebRuTSh0HnTQ/arcgis/rest/services/WL_PIEZOMETROS_GEOTECNIA_V2/FeatureServer/1";

type ArcGISQueryResponse = {
  features?: Array<{
    attributes: SummaryRow;
  }>;
  exceededTransferLimit?: boolean;
  error?: {
    message?: string;
    details?: string[];
  };
};

async function getUserToken(): Promise<string> {
  const sessionManager = SessionManager.getInstance();

  let session = sessionManager.getMainSession();

  if (!session) {
    session = await sessionManager.signInByResourceUrl(
      SUMMARY_TABLE_URL,
      PORTAL_URL,
      true,
    );
  }

  if (!session) {
    throw new Error(
      "No se pudo iniciar sesión en ArcGIS. Verifica la configuración OAuth de la aplicación.",
    );
  }

  const token = await session.getToken(SUMMARY_TABLE_URL);

  if (!token) {
    throw new Error("No se pudo obtener token de la sesión activa.");
  }

  return token;
}

export async function queryAllSummaryRows(): Promise<SummaryRow[]> {
  const token = await getUserToken();

  const pageSize = 2000;
  let offset = 0;
  const rows: SummaryRow[] = [];

  while (true) {
    const params = new URLSearchParams({
      f: "json",
      where: "1=1",
      outFields: SUMMARY_OUT_FIELDS.join(","),
      returnGeometry: "false",
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
      orderByFields: "OBJECTID ASC",
      token,
    });

    const response = await fetch(
      `${SUMMARY_TABLE_URL}/query?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(
        `Error HTTP consultando tabla resumen: ${response.status}`,
      );
    }

    const data = (await response.json()) as ArcGISQueryResponse;

    if (data.error) {
      throw new Error(
        `${data.error.message ?? "Error ArcGIS REST"} ${
          data.error.details?.join(" ") ?? ""
        }`,
      );
    }

    const features = data.features ?? [];

    if (features.length === 0) {
      break;
    }

    rows.push(...features.map((feature) => feature.attributes));

    if (features.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return rows;
}
