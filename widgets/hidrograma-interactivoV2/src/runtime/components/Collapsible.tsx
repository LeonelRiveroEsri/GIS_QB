/** @jsx jsx */
import { css } from "jimu-core";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  title: string;
  open: boolean;
  children?: React.ReactNode;
  onToggle: () => void;
}

const card = css`
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(8px) saturate(120%);
  -webkit-backdrop-filter: blur(8px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 14px;
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.18),
    0 3px 8px rgba(0, 0, 0, 0.1);
  margin: 12px;
`;

const cardOpen = css`
  box-shadow:
    0 14px 30px rgba(221, 89, 0, 0.2),
    0 3px 10px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #001040;
`;

const header = css`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  font-weight: 700;
  color: #1d1d1f;
  background: transparent;
  border: 0;
  cursor: pointer;
  border-radius: 14px;
  &:hover {
    background: rgba(255, 255, 255, 0.35);
  }
  &:focus-visible {
    outline: 2px solid #007ac2;
    outline-offset: 2px;
  }
`;

const chev = css`
  transition: transform 0.2s ease;
  &.open {
    transform: rotate(90deg);
  }
`;

const bodyWrap = css`
  overflow: hidden;
  transition:
    max-height 0.24s ease,
    opacity 0.18s ease;
`;

const bodyInner = css`
  padding: 12px 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
`;

const ChevronIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const Collapsible: React.FC<Props> = ({ title, open, children, onToggle }) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = useState<number>(open ? 0 : 0);

  // función de medición segura
  const measure = React.useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    const h = el.scrollHeight; // altura real del contenido
    // animación más suave: usar rAF
    requestAnimationFrame(() => {
      setMaxH(open ? h : 0);
    });
  }, [open]);

  // medir al montar y cada vez que se abre/cierra
  useEffect(() => {
    measure();
  }, [open, measure]);

  // 🔎 Escuchar cambios de tamaño del contenido (mensajes que llegan, etc.)
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    if (!("ResizeObserver" in window)) {
      // fallback: re-medimos por evento de window resize
      const onWinResize = () => {
        open && measure();
      };
      window.addEventListener("resize", onWinResize);
      return () => {
        window.removeEventListener("resize", onWinResize);
      };
    }

    const ro = new ResizeObserver(() => {
      // solo si está abierto actualizamos, sino mantenemos 0 para colapsar
      if (open) measure();
    });
    ro.observe(el);
    // también reaccionar a resize de la ventana
    const onWinResize = () => {
      open && measure();
    };
    window.addEventListener("resize", onWinResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWinResize);
    };
  }, [open, measure]);

  // opcional: al terminar la transición y estando abierto, ajusta exacto
  const onTransitionEnd = () => {
    if (open) measure();
  };

  const dark = useMemo(() => false, []);
  return (
    <div css={[card, open && cardOpen]} data-theme={dark ? "dark" : "light"}>
      <button
        type="button"
        css={header}
        onClick={onToggle}
        aria-expanded={open}
      >
        <ChevronIcon className={`${open ? "open" : ""}`} css={chev} />
        <span>{title}</span>
      </button>

      <div
        css={bodyWrap}
        style={{ maxHeight: open ? maxH : 0, opacity: open ? 1 : 0 }}
        aria-hidden={!open}
        onTransitionEnd={onTransitionEnd}
      >
        <div css={bodyInner} ref={innerRef}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Collapsible;
