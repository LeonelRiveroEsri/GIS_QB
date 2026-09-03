import { React } from 'jimu-core'
import type { ChartFieldInfo } from './chart-field-analysis'

interface FieldControlProps {
  label: string
  candidates: ChartFieldInfo[]
  selected: string
  onChange: (field: string) => void
}

const FieldControl = ({ label, candidates, selected, onChange }: FieldControlProps) => <div className='ai-chart-field-row'>
  <span>{label}:</span>
  {candidates.length <= 6
    ? candidates.map(field => <button
      type='button'
      key={field.name}
      className={`ai-chart-chip${selected === field.name ? ' active' : ''}`}
      aria-pressed={selected === field.name}
      onClick={() => onChange(field.name)}
    >{field.name}</button>)
    : <select aria-label={label} value={selected} onChange={event => onChange(event.target.value)}>
      {candidates.map(field => <option key={field.name} value={field.name}>{field.name}</option>)}
    </select>}
</div>

interface Props {
  xCandidates: ChartFieldInfo[]
  yCandidates: ChartFieldInfo[]
  xField: string
  yField: string
  onXFieldChange: (field: string) => void
  onYFieldChange: (field: string) => void
}

const ChartAxisControls = (props: Props) => <div className='ai-chart-fields'>
  <FieldControl label='Eje X' candidates={props.xCandidates} selected={props.xField} onChange={props.onXFieldChange}/>
  <FieldControl label='Eje Y' candidates={props.yCandidates} selected={props.yField} onChange={props.onYFieldChange}/>
</div>

export default ChartAxisControls