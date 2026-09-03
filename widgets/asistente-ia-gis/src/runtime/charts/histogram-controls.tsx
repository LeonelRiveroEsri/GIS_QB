import { React } from 'jimu-core'
import type { ChartFieldInfo } from './chart-field-analysis'
import type { HistogramBinOption } from './histogram-calculations'

interface Props {
  fields: ChartFieldInfo[]
  field: string
  bins: HistogramBinOption
  onFieldChange: (field: string) => void
  onBinsChange: (bins: HistogramBinOption) => void
}

const HistogramControls = ({ fields, field, bins, onFieldChange, onBinsChange }: Props) => <div className='ai-chart-fields'>
  <div className='ai-chart-field-row'><span>Campo:</span>
    {fields.map(candidate => <button type='button' key={candidate.name} className={`ai-chart-chip${field === candidate.name ? ' active' : ''}`} aria-pressed={field === candidate.name} onClick={() => onFieldChange(candidate.name)}>{candidate.name}</button>)}
  </div>
  <div className='ai-chart-field-row'><span>Bins:</span>
    {(['auto', 5, 10, 15, 20] as HistogramBinOption[]).map(option => <button type='button' key={option} className={`ai-chart-chip${bins === option ? ' active' : ''}`} aria-pressed={bins === option} onClick={() => onBinsChange(option)}>{option === 'auto' ? 'Auto' : option}</button>)}
  </div>
</div>

export default HistogramControls