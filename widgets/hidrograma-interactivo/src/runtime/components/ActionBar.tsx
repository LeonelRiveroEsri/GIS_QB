import React from 'react'

type Props = {
  loading: boolean
  disabled?: boolean
  onApply: () => void
  onClear: () => void
}

export function ActionBar (props: Props) {
  const { loading, disabled = false, onApply, onClear } = props

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
      <button
        type='button'
        disabled={loading || disabled}
        onClick={onApply}
        style={{
          border: 0,
          borderRadius: 10,
          background: '#2563eb',
          color: '#fff',
          padding: '10px 16px',
          fontWeight: 900,
          cursor: loading || disabled ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Consultando...' : 'Aplicar filtros'}
      </button>

      <button
        type='button'
        disabled={loading}
        onClick={onClear}
        style={{
          border: 0,
          borderRadius: 10,
          background: '#e5e7eb',
          color: '#111827',
          padding: '10px 16px',
          fontWeight: 900,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        Limpiar filtros
      </button>
    </div>
  )
}
