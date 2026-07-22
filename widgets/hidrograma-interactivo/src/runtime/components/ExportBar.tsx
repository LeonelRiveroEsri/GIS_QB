import React, { useMemo, useState } from 'react'
import { DetailRow, SeriesSummary } from '../types'
import {
  buildExportFilename,
  buildExportRows,
  exportRowsToCsv,
  exportRowsToXlsx
} from '../utils/export'

type Props = {
  rows: DetailRow[]
  series: SeriesSummary[]
  disabled?: boolean
}

const buttonBase: React.CSSProperties = {
  border: 0,
  borderRadius: 10,
  padding: '10px 14px',
  cursor: 'pointer',
  fontWeight: 900
}

export function ExportBar (props: Props) {
  const { rows, series, disabled = false } = props

  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportRows = useMemo(() => {
    return buildExportRows(rows, series)
  }, [rows, series])

  const isDisabled = disabled || exporting || exportRows.length === 0

  const handleCsv = () => {
    try {
      setError(null)
      exportRowsToCsv(
        exportRows,
        buildExportFilename('csv')
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error exportando CSV.')
    }
  }

  const handleXlsx = async () => {
    try {
      setExporting(true)
      setError(null)

      await exportRowsToXlsx(
        exportRows,
        buildExportFilename('xlsx')
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error exportando XLSX.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type='button'
          disabled={isDisabled}
          onClick={handleCsv}
          style={{
            ...buttonBase,
            background: isDisabled ? '#94a3b8' : '#0f766e',
            color: '#ffffff',
            cursor: isDisabled ? 'not-allowed' : 'pointer'
          }}
        >
          Exportar datos gráfico CSV
        </button>

        <button
          type='button'
          disabled={isDisabled}
          onClick={handleXlsx}
          style={{
            ...buttonBase,
            background: isDisabled ? '#94a3b8' : '#0f766e',
            color: '#ffffff',
            cursor: isDisabled ? 'not-allowed' : 'pointer'
          }}
        >
          {exporting ? 'Exportando XLSX...' : 'Exportar datos gráfico XLSX'}
        </button>

        <div style={{ color: '#627d98', fontSize: 13 }}>
          Filas visibles para exportar: {exportRows.length.toLocaleString('es-CL')}
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            borderRadius: 10,
            background: '#fff1f0',
            color: '#b42318',
            border: '1px solid #ffd3cf',
            fontWeight: 700
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
