// =====================================================
// FILE: src/runtime/components/MultiSelectBlock.tsx
// =====================================================
import React, { useMemo } from "react";
import { Option } from "../types";

const listBoxStyle: React.CSSProperties = {
  width: "100%",
  height: 160,
  border: "1px solid #cfd8e3",
  borderRadius: 12,
  padding: 8,
  background: "#fff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #cfd8e3",
  borderRadius: 8,
  background: "#fff",
  color: "#102a43",
  padding: "7px 10px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 12,
};

type Props = {
  title: string;
  options: Option[];
  selected: string[];
  disabled?: boolean;
  onChange: (values: string[]) => void;
};

export function MultiSelectBlock(props: Props) {
  const { title, options, selected, disabled = false, onChange } = props;

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const handleSelectChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(evt.target.selectedOptions).map(
      (opt) => opt.value,
    );
    onChange(values);
  };

  const selectAll = () => onChange(options.map((option) => option.value));
  const selectNone = () => onChange([]);
  const invert = () => {
    onChange(
      options
        .filter((option) => !selectedSet.has(option.value))
        .map((option) => option.value),
    );
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, color: "#102a43" }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: "#627d98" }}>{options.length}</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          style={buttonStyle}
          disabled={disabled}
          onClick={selectAll}
        >
          Todo
        </button>
        <button
          type="button"
          style={buttonStyle}
          disabled={disabled}
          onClick={selectNone}
        >
          Ninguno
        </button>
        <button
          type="button"
          style={buttonStyle}
          disabled={disabled}
          onClick={invert}
        >
          Invertir
        </button>
      </div>

      <select
        multiple
        value={selected}
        disabled={disabled}
        onChange={handleSelectChange}
        style={{
          ...listBoxStyle,
          opacity: disabled ? 0.55 : 1,
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
