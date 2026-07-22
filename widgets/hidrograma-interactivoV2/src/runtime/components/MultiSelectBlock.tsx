import { React } from "jimu-core";

type Props = {
  title: string;
  options: string[];
  selected: string[];
  disabled?: boolean;
  onChange: (values: string[]) => void;
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #cfd8e3",
  borderRadius: 8,
  background: "#fff",
  padding: "7px 10px",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 13,
};

export function MultiSelectBlock(props: Props) {
  const { title, options, selected, disabled, onChange } = props;

  const [open, setOpen] = React.useState<boolean>(false);

  const selectedSet = React.useMemo(() => new Set(selected), [selected]);

  const label =
    selected.length === 0
      ? "Sin filtro"
      : selected.length === options.length
        ? "Todos"
        : `${selected.length} seleccionado(s)`;

  const toggleValue = (value: string) => {
    if (disabled) return;

    if (selectedSet.has(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleSelectAll = () => onChange([...options]);
  const handleClear = () => onChange([]);
  const handleInvert = () =>
    onChange(options.filter((option) => !selectedSet.has(option)));

  return (
    <div
      style={{
        border: "1px solid #d9e2ec",
        borderRadius: 12,
        background: "#fff",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "100%",
          border: "none",
          background: "#ffffff",
          padding: "12px 14px",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textAlign: "left",
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#102a43" }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: "#627d98", marginTop: 2 }}>
            {label} · {options.length.toLocaleString("es-CL")} disponible(s)
          </div>
        </div>

        <div style={{ fontSize: 18, color: "#102a43" }}>{open ? "▴" : "▾"}</div>
      </button>

      {open && (
        <div
          style={{
            borderTop: "1px solid #edf2f7",
            padding: 12,
            background: "#fbfdff",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={handleSelectAll}
              style={buttonStyle}
            >
              Todo
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={handleClear}
              style={buttonStyle}
            >
              Ninguno
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={handleInvert}
              style={buttonStyle}
            >
              Invertir
            </button>
          </div>

          <div
            style={{
              maxHeight: 190,
              overflowY: "auto",
              border: "1px solid #d9e2ec",
              borderRadius: 10,
              background: "#fff",
            }}
          >
            {options.map((option) => {
              const checked = selectedSet.has(option);

              return (
                <label
                  key={option}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f0f4f8",
                    fontSize: 14,
                    color: "#102a43",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleValue(option)}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
