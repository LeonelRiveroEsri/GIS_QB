import { DetailRow, SeriesSummary } from "../types";

function getDateValue(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return new Date(value).getTime();
  if (value instanceof Date) return value.getTime();
  return 0;
}

function formatDate(value: unknown): string {
  if (!value) return "";
  const date = new Date(value as any);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("es-CL");
}

export function buildSeriesSummaries(rows: DetailRow[]): SeriesSummary[] {
  const map = new Map<string, DetailRow[]>();

  rows.forEach((row) => {
    const pozo = row.POZO ?? "";
    const sensor = row.SENSOR ?? "";

    const keyElevacion = `${pozo}|${sensor}|ELEVACION`;
    // Use empty sensor for collar so it groups per POZO
    const keyCollar = `${pozo}||COTA_COLLAR`;

    if (!map.has(keyElevacion)) map.set(keyElevacion, []);
    map.get(keyElevacion)?.push(row);

    if (row.COTA_COLLAR !== null && row.COTA_COLLAR !== undefined) {
      if (!map.has(keyCollar)) map.set(keyCollar, []);
      map.get(keyCollar)?.push(row);
    }
  });

  const summaries: SeriesSummary[] = [];

  map.forEach((items, key) => {
    const [pozo, sensor, tipo] = key.split("|");

    const sorted = [...items].sort((a, b) => {
      return (
        getDateValue(a.FECHA_HORA ?? a.FECHA) -
        getDateValue(b.FECHA_HORA ?? b.FECHA)
      );
    });

    const last = sorted[sorted.length - 1];

    const ultimoValor =
      tipo === "COTA_COLLAR"
        ? Number(last.COTA_COLLAR ?? 0)
        : Number(last.ELEVACION ?? 0);

    const label =
      tipo === "COTA_COLLAR"
        ? `${pozo} - COTA_COLLAR`
        : `${pozo} - ${sensor} - ${tipo}`;

    summaries.push({
      id: key,
      serie: label,
      pozo,
      sensor,
      tipo: tipo as "ELEVACION" | "COTA_COLLAR",
      ultimoValor,
      fechaUltimoRegistro: formatDate(last.FECHA ?? last.FECHA_HORA),
      visible: true,
    });
  });

  return summaries.sort((a, b) => a.serie.localeCompare(b.serie, "es"));
}
