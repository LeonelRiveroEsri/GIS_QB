import { React } from 'jimu-core'
import type { ChartFieldInfo } from './chart-field-analysis'
import type { DonutValueField } from './donut-calculations'

interface Props {
  categories: ChartFieldInfo[]
  values: ChartFieldInfo[]
  categoryField: string
  mode: 'count' | 'sum'
  valueField: DonutValueField
  onCategoryChange: (field: string) => void
  onModeChange: (mode: 'count' | 'sum') => void
  onValueFieldChange: (field: string) => void
}

const DonutControls = ({ categories, values, categoryField, mode, valueField, onCategoryChange, onModeChange, onValueFieldChange }: Props) => <div className='ai-chart-fields'>
  <div className='ai-chart-field-row'><span>Categoría:</span>
    {categories.map(field => <button type='button' key={field.name} className={`ai-chart-chip${categoryField === field.name ? ' active' : ''}`} aria-pressed={categoryField === field.name} onClick={() => onCategoryChange(field.name)}>{field.name}</button>)}
  </div>
  <div className='ai-chart-field-row'><span>Modo:</span>
    <button type='button' className={`ai-chart-chip${mode === 'count' ? ' active' : ''}`} aria-pressed={mode === 'count'} onClick={() => onModeChange('count')}>Conteo</button>
    <button type='button' className={`ai-chart-chip${mode === 'sum' ? ' active' : ''}`} aria-pressed={mode === 'sum'} onClick={() => onModeChange('sum')}>Suma</button>
  </div>
  {mode === 'sum' && <div className='ai-chart-field-row'><span>Campo:</span>{values.map(field => <button type='button' key={field.name} className={`ai-chart-chip${valueField === field.name ? ' active' : ''}`} aria-pressed={valueField === field.name} onClick={() => onValueFieldChange(field.name)}>{field.name}</button>)}</div>}
</div>

export default DonutControls