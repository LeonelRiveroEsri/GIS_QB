import { SeriesSummary } from "../types";

type Props = {
  series: SeriesSummary[];
  onToggleSerie: (id: string, visible: boolean) => void;
  onOnlySerie: (id: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
};
function formatDate(value: any): string {
  if (!value) return "-";

  try {
    const date = new Date(value);

    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("es-CL");
  } catch {
    return "-";
  }
}
export function SeriesTable(props: Props) {
  const { series, onToggleSerie, onOnlySerie, onShowAll, onHideAll } = props;

  return (
    <div
      style={{
        marginTop: 18,
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        style={{
          background: "#f3f4f6",
          padding: "12px 14px",
          fontWeight: 800,
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div>Resumen de series mostradas</div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={onShowAll}>
            Mostrar todas
          </button>
          <button type="button" onClick={onHideAll}>
            Ocultar todas
          </button>
        </div>
      </div>

      <div style={{ maxHeight: 320, overflow: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr>
              {[
                "Mostrar",
                "Serie",
                "Tipo",
                "Último valor",
                "Fecha último registro",
                "Acciones",
              ].map((header) => (
                <th
                  key={header}
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "#e5e7eb",
                    zIndex: 1,
                    textAlign: "left",
                    padding: 10,
                    borderBottom: "1px solid #cbd5e1",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {series.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: "center", color: "#6b7280", padding: 14 }}
                >
                  Aplica filtros para ver el resumen de series.
                </td>
              </tr>
            )}

            {series.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: 10, borderBottom: "1px solid #edf2f7" }}>
                  <input
                    type="checkbox"
                    checked={item.visible}
                    onChange={(e) => onToggleSerie(item.id, e.target.checked)}
                  />
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid #edf2f7" }}>
                  {item.serie}
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid #edf2f7" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      background:
                        item.tipo === "ELEVACION" ? "#dbeafe" : "#ede9fe",
                      color: item.tipo === "ELEVACION" ? "#1d4ed8" : "#6d28d9",
                    }}
                  >
                    {item.tipo}
                  </span>
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid #edf2f7" }}>
                  {Number(item.ultimoValor || 0).toFixed(3)}
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid #edf2f7" }}>
                  {formatDate(item.fechaUltimoRegistro)}
                </td>
                <td
                  style={{
                    padding: 10,
                    borderBottom: "1px solid #edf2f7",
                    whiteSpace: "nowrap",
                  }}
                >
                  <button type="button" onClick={() => onOnlySerie(item.id)}>
                    Solo esta serie
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
