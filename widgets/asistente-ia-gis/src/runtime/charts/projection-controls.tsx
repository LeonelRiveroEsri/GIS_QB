import { React } from 'jimu-core'
import { MAX_PROJECTION_DAYS, validateProjectionDays } from './projection-calculations'

export type ProjectionOption = 'none' | 7 | 30 | 60 | 90 | 120 | 'custom'

interface Props {
  option: ProjectionOption
  customValue: string
  customError: boolean
  disabled: boolean
  onOptionChange: (option: ProjectionOption) => void
  onCustomValueChange: (value: string) => void
  onApplyCustom: (days: number) => void
}

const Chip = ({ active, children, disabled = false, onClick }: { active: boolean, children: React.ReactNode, disabled?: boolean, onClick: () => void }) => <button
  type='button'
  className={`ai-chart-chip${active ? ' active' : ''}`}
  aria-pressed={active}
  disabled={disabled}
  onClick={onClick}
>{children}</button>

const ProjectionControls = ({ option, customValue, customError, disabled, onOptionChange, onCustomValueChange, onApplyCustom }: Props) => {
  const applyCustom = () => {
    const days = Number(customValue)
    onApplyCustom(validateProjectionDays(days) && String(days) === customValue.trim() ? days : Number.NaN)
  }

  return <div className='ai-chart-projection-controls'>
    <div className='ai-chart-trend-row'><span>Proyección:</span>
      <Chip active={option === 'none'} onClick={() => onOptionChange('none')}>Sin proyección</Chip>
      {([7, 30, 60, 90, 120] as const).map(days => <Chip key={days} active={option === days} disabled={disabled} onClick={() => onOptionChange(days)}>{days} días</Chip>)}
      <Chip active={option === 'custom'} disabled={disabled} onClick={() => onOptionChange('custom')}>Personalizado</Chip>
    </div>
    {option === 'custom' && <div className='ai-chart-custom-projection'>
      <input
        type='number'
        min='1'
        max={MAX_PROJECTION_DAYS}
        step='1'
        value={customValue}
        disabled={disabled}
        aria-label='Días de proyección'
        onChange={event => onCustomValueChange(event.target.value)}
      />
      <span>días</span>
      <button type='button' className='ai-chart-apply' disabled={disabled} onClick={applyCustom}>Aplicar</button>
    </div>}
    {customError && <div className='ai-chart-trend-status'>Ingrese un número de días entre 1 y 3650.</div>}
  </div>
}

export default ProjectionControls