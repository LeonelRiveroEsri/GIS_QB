import React from 'react'

type Props = {
  records: number
  series: number
  rango: string
  loading?: boolean
}

const chipStyle: React.CSSProperties = {
  background: '#eef2ff',
  padding: '8px 12px',
  borderRadius: 999,
  color: '#374151',
  fontSize: 14
}

export function SummaryChips (props: Props) {
  const { records, series, rango, loading = false } = props

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
      <div style={chipStyle}>Registros: {loading ? '...' : records.toLocaleString('es-CL')}</div>
      <div style={chipStyle}>Series: {loading ? '...' : series.toLocaleString('es-CL')}</div>
      <div style={chipStyle}>Rango: {rango || '-'}</div>
    </div>
  )
}
