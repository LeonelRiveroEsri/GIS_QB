/** @jsx jsx */
import { jsx } from "jimu-core";
import { Label } from "jimu-ui";
import React from "react";

interface Props {
  open: boolean;
  fechaInicio: string;
  onChangeInicio: (v: string) => void;
}

const FiltroFechas: React.FC<Props> = ({
  open,
  fechaInicio,
  onChangeInicio,
}) => (
  <div style={{ padding: 12 }}>
    <Label htmlFor="Fecha" style={{ fontWeight: "bold" }}>
      Fecha de Inicio:
    </Label>
    <input
      type="date"
      id="fechaInicio"
      value={fechaInicio}
      onChange={(e) => {
        onChangeInicio(e.target.value);
      }}
      style={{ width: "100%", marginBottom: 8 }}
    />
  </div>
);

export default FiltroFechas;
