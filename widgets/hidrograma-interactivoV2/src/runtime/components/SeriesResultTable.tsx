import { React } from "jimu-core";

export type ResultSerieRow = {
  id: string;
  serie: string;
  tipo: string;
  ultimoValor?: number | string;
  fechaUltimoRegistro?: string;
  visible: boolean;
};

type Props = {
  rows: ResultSerieRow[];
  onRowsChange: (rows: ResultSerieRow[]) => void;
  onOnlySerie?: (row: ResultSerieRow) => void;
};

export function SeriesResultTable(props: Props) {
  const { rows, onRowsChange, onOnlySerie } = props;

  const setAllVisible = (visible: boolean) => {
    onRowsChange(rows.map((row) => ({ ...row, visible })));
  };

  const toggleRow = (id: string) => {
    onRowsChange(
      rows.map((row) =>
        row.id === id ? { ...row, visible: !row.visible } : row,
      ),
    );
  };

  const onlyRow = (target: ResultSerieRow) => {
    const nextRows = rows.map((row) => ({
      ...row,
      visible: row.id === target.id,
    }));

    onRowsChange(nextRows);
    onOnlySerie?.(target);
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d9e2ec",
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 220,
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid #e4e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flex: "0 0 auto",
        }}
      >
        <strong>Resumen de series mostradas</strong>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setAllVisible(true)}>
            Mostrar todas
          </button>

          <button type="button" onClick={() => setAllVisible(false)}>
            Ocultar todas
          </button>
        </div>
      </div>

      <div style={{ overflow: "hidden", flex: "1 1 auto", minHeight: 0 }}>
        <div style={{ height: "100%", overflow: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ background: "#f1f4f8" }}>
                <th style={thStyle}>Mostrar</th>
                <th style={thStyle}>Serie</th>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Último valor</th>
                <th style={thStyle}>Fecha último registro</th>
                <th style={thStyle}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 16, color: "#829ab1" }}>
                    No hay series disponibles para mostrar.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    style={{ borderBottom: "1px solid #edf2f7" }}
                  >
                    <td style={tdStyle}>
                      <input
                        type="checkbox"
                        checked={row.visible}
                        onChange={() => toggleRow(row.id)}
                      />
                    </td>

                    <td style={tdStyle}>{row.serie}</td>

                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: "5px 10px",
                          borderRadius: 999,
                          fontWeight: 800,
                          fontSize: 12,
                          background:
                            row.tipo === "COTA_COLLAR" ? "#efe7ff" : "#dbeafe",
                          color:
                            row.tipo === "COTA_COLLAR" ? "#6d28d9" : "#1d4ed8",
                        }}
                      >
                        {row.tipo}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {typeof row.ultimoValor === "number"
                        ? row.ultimoValor.toLocaleString("es-CL", {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                          })
                        : (row.ultimoValor ?? "—")}
                    </td>
                    <td style={tdStyle}>{row.fechaUltimoRegistro ?? "—"}</td>

                    <td style={tdStyle}>
                      <button type="button" onClick={() => onlyRow(row)}>
                        Solo esta serie
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 900,
  color: "#102a43",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  color: "#102a43",
  whiteSpace: "nowrap",
};
