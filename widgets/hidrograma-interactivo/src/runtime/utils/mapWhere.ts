import { DetailRow } from "../types";

function escapeSqlText(value: string): string {
  return value.replace(/'/g, "''");
}

export function buildPozosWhereFromDetailRows(rows: DetailRow[]): string {
  const pozos = Array.from(
    new Set(
      rows
        .map((row) => row.POZO)
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter((value) => value !== ""),
    ),
  );

  if (!pozos.length) return "1=2";

  const values = pozos.map((pozo) => `'${escapeSqlText(pozo)}'`);

  const where =
    values.length === 1
      ? `POZO = ${values[0]}`
      : `POZO IN (${values.join(",")})`;

  console.log("WHERE MAPA POZOS:", where);

  return where;
}
