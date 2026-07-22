import type { DetailRow, SeriesSummary } from "../types";

export type ExportRow = {
  SERIE: string;
  TIPO: string;
  CAMPANA: string;
  POZO: string;
  SENSOR: string;
  PIEZOMETRO_SENSOR: string;
  SECTOR_GRUPO: string;
  SECTOR_BASE: string;
  DETALLE: string;
  FECHA: string;
  FECHA_HORA: string;
  ELEVACION: number | null;
  COTA_COLLAR: number | null;
  PROFUNDIDAD_SENSOR: number | null;
  TEMPERATURA: number | null;
  ESTATUS: string;
  OBS: string;
};

const XLSX_SRC =
  "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";

declare global {
  interface Window {
    XLSX?: any;
  }
}

function normalizeDate(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";

  const date = new Date(value as any);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toISOString().slice(0, 10);
}

function normalizeDateTime(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";

  const date = new Date(value as any);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toISOString().replace("T", " ").slice(0, 19);
}

function getSerieId(row: DetailRow, tipo: "ELEVACION" | "COTA_COLLAR"): string {
  const pozo = row.POZO ?? "";
  const sensor = row.SENSOR ?? "";
  if (tipo === "COTA_COLLAR") {
    // collar series are grouped by POZO only; keep empty sensor segment to match series id format
    return `${pozo}||COTA_COLLAR`;
  }

  return `${pozo}|${sensor}|${tipo}`;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const num = Number(value);

  return Number.isFinite(num) ? num : null;
}

export function buildExportRows(
  rows: DetailRow[],
  series: SeriesSummary[],
): ExportRow[] {
  const visibleSeries = new Set(
    series.filter((item) => item.visible).map((item) => item.id),
  );

  const exportRows: ExportRow[] = [];

  rows.forEach((row) => {
    const elevacionId = getSerieId(row, "ELEVACION");
    const collarId = getSerieId(row, "COTA_COLLAR");

    if (visibleSeries.has(elevacionId)) {
      exportRows.push({
        SERIE: `${row.POZO ?? ""} | ${row.SENSOR ?? ""} - ELEVACION`,
        TIPO: "ELEVACION",
        CAMPANA: row.CAMPANA ?? "",
        POZO: row.POZO ?? "",
        SENSOR: row.SENSOR ?? "",
        PIEZOMETRO_SENSOR: row.PIEZOMETRO_SENSOR ?? "",
        SECTOR_GRUPO: row.SECTOR_GRUPO ?? "",
        SECTOR_BASE: row.SECTOR_BASE ?? "",
        DETALLE: row.DETALLE ?? "",
        FECHA: normalizeDate(row.FECHA),
        FECHA_HORA: normalizeDateTime(row.FECHA_HORA),
        ELEVACION: toNumberOrNull(row.ELEVACION),
        COTA_COLLAR: toNumberOrNull(row.COTA_COLLAR),
        PROFUNDIDAD_SENSOR: toNumberOrNull(row.PROFUNDIDAD_SENSOR),
        TEMPERATURA: toNumberOrNull(row.TEMPERATURA),
        ESTATUS: row.ESTATUS ?? "",
        OBS: row.OBS ?? "",
      });
    }

    if (
      visibleSeries.has(collarId) &&
      row.COTA_COLLAR !== null &&
      row.COTA_COLLAR !== undefined
    ) {
      exportRows.push({
        SERIE: `${row.POZO ?? ""} - COTA_COLLAR`,
        TIPO: "COTA_COLLAR",
        CAMPANA: row.CAMPANA ?? "",
        POZO: row.POZO ?? "",
        SENSOR: row.SENSOR ?? "",
        PIEZOMETRO_SENSOR: row.PIEZOMETRO_SENSOR ?? "",
        SECTOR_GRUPO: row.SECTOR_GRUPO ?? "",
        SECTOR_BASE: row.SECTOR_BASE ?? "",
        DETALLE: row.DETALLE ?? "",
        FECHA: normalizeDate(row.FECHA),
        FECHA_HORA: normalizeDateTime(row.FECHA_HORA),
        ELEVACION: null,
        COTA_COLLAR: toNumberOrNull(row.COTA_COLLAR),
        PROFUNDIDAD_SENSOR: null,
        TEMPERATURA: null,
        ESTATUS: row.ESTATUS ?? "",
        OBS: row.OBS ?? "",
      });
    }
  });

  return exportRows;
}

function downloadBlob(content: BlobPart, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  const text = String(value);

  if (
    text.includes('"') ||
    text.includes(",") ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function exportRowsToCsv(rows: ExportRow[], filename: string): void {
  if (!rows.length) {
    throw new Error("No hay datos visibles para exportar.");
  }

  const headers = Object.keys(rows[0]) as Array<keyof ExportRow>;

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(","),
    ),
  ];

  const csv = "\ufeff" + lines.join("\n");

  downloadBlob(
    csv,
    filename.endsWith(".csv") ? filename : `${filename}.csv`,
    "text/csv;charset=utf-8;",
  );
}

async function loadSheetJs(): Promise<any> {
  // Prefer static local import if available
  try {
    if (
      localXLSX &&
      localXLSX.utils &&
      typeof localXLSX.utils.json_to_sheet === "function"
    ) {
      return localXLSX;
    }
  } catch (e) {
    // ignore
  }

  // Try dynamic import at runtime
  try {
    const mod = await import("xlsx");
    const candidate =
      mod && (mod.utils ? mod : mod.default ? mod.default : null);
    if (
      candidate &&
      candidate.utils &&
      typeof candidate.utils.json_to_sheet === "function"
    ) {
      return candidate;
    }
  } catch (e) {
    // dynamic import failed, continue to CDN fallback
  }

  // Use global if present
  if (
    window.XLSX &&
    window.XLSX.utils &&
    typeof window.XLSX.utils.json_to_sheet === "function"
  ) {
    return window.XLSX;
  }

  // Load from CDN
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      `script[src="${XLSX_SRC}"]`,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (
          window.XLSX &&
          window.XLSX.utils &&
          typeof window.XLSX.utils.json_to_sheet === "function"
        ) {
          resolve(window.XLSX);
        } else {
          reject(
            new Error(
              "SheetJS cargado pero falta la función requerida json_to_sheet.",
            ),
          );
        }
      });
      existingScript.addEventListener("error", () =>
        reject(new Error("No se pudo cargar SheetJS.")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = XLSX_SRC;
    script.async = true;
    script.onload = () => {
      if (
        window.XLSX &&
        window.XLSX.utils &&
        typeof window.XLSX.utils.json_to_sheet === "function"
      ) {
        resolve(window.XLSX);
      } else {
        reject(
          new Error(
            "SheetJS cargado pero falta la función requerida json_to_sheet.",
          ),
        );
      }
    };
    script.onerror = () => reject(new Error("No se pudo cargar SheetJS."));

    document.body.appendChild(script);
  });
}

export async function exportRowsToXlsx(
  rows: ExportRow[],
  filename: string,
): Promise<void> {
  if (!rows.length) {
    throw new Error("No hay datos visibles para exportar.");
  }

  const XLSX = await loadSheetJs();
  if (!XLSX || !XLSX.utils || typeof XLSX.utils.json_to_sheet !== "function") {
    throw new Error(
      "SheetJS no está disponible o no contiene la función json_to_sheet.",
    );
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Hidrograma");

  XLSX.writeFile(
    workbook,
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`,
  );
}

export function buildExportFilename(extension: "csv" | "xlsx"): string {
  const now = new Date();
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+/, "")
    .replace("T", "_");

  return `hidrograma_v2_${stamp}.${extension}`;
}
