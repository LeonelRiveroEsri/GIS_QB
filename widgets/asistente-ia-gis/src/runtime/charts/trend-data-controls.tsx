import { React } from 'jimu-core'
import { MAX_SEGMENT_DAYS, type TrendDataMode, validateSegmentDays } from './trend-data-segmentation'

interface Props {
  mode: TrendDataMode
  customValue: string
  customError: boolean
  onModeChange: (mode: TrendDataMode) => void
  onCustomValueChange: (value: string) => void
  onApplyCustom: (days: number) => void
}

const Chip = ({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void }) => <button
  type='button'
  className={`ai-chart-chip${active ? ' active' : ''}`}
  aria-pressed={active}
  onClick={onClick}
>{children}</button>

const TrendDataControls = ({ mode, customValue, customError, onModeChange, onCustomValueChange, onApplyCustom }: Props) => {
  const applyCustom = () => {
    const days = Number(customValue)
    onApplyCustom(validateSegmentDays(days) && String(days) === customValue.trim() ? days : Number.NaN)
  }

  return <div className='ai-chart-segmentation'>
    <div className='ai-chart-trend-row'><span>Datos para tendencia:</span>
      <Chip active={mode === 'all'} onClick={() => onModeChange('all')}>Todos</Chip>
      {([7, 30, 60, 90, 120] as const).map(days => <Chip key={days} active={mode === days} onClick={() => onModeChange(days)}>{days} d</Chip>)}
      <Chip active={mode === 'custom'} onClick={() => onModeChange('custom')}>Personalizado</Chip>
    </div>
    {mode === 'custom' && <div className='ai-chart-custom-projection'>
      <input type='number' min='1' max={MAX_SEGMENT_DAYS} step='1' value={customValue} aria-label='Días para tendencia' onChange={event => onCustomValueChange(event.target.value)}/>
      <span>días</span>
      <button type='button' className='ai-chart-apply' onClick={applyCustom}>Aplicar</button>
    </div>}
    {customError && <div className='ai-chart-trend-status'>Ingrese un número de días entre 1 y 3650.</div>}
  </div>
}

export default TrendDataControls