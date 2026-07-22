/** @jsx jsx */
import { jsx, css } from 'jimu-core';

const panelWrap = css`
  position: fixed;
  top: 72px;                /* debajo del header naranja */
  left: 12px;
  width: min(560px, calc(100vw - 24px));
  bottom: 12px;
  overflow-y: auto;         /* 👈 aquí está el scroll */
  overscroll-behavior: contain;
  z-index: 1800;
  padding-right: 12px;

  /* 🔑 Ocultar scrollbar pero permitir scroll */
  scrollbar-width: none;        /* Firefox */
  -ms-overflow-style: none;     /* IE y Edge antiguos */
  &::-webkit-scrollbar {        /* Chrome, Safari */
    display: none;
  }
`;

export default function PanelConTarjetas({ children }) {
  return <div css={panelWrap}>{children}</div>;
}
