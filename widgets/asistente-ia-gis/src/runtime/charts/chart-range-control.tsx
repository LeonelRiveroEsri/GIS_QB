import { React } from 'jimu-core'
import type { ChartViewportItem, ChartViewportState } from './chart-viewport-state'

interface Props {
  items: ChartViewportItem[]
  value: ChartViewportState
  onChange: (viewport: ChartViewportState) => void
  onReset: () => void
}

const ChartRangeControl = ({ items, value, onChange, onReset }: Props) => {
  if (items.length < 2) return null
  const lastIndex = items.length - 1
  const updateStart = (startIndex: number) => onChange({ startIndex: Math.min(startIndex, value.endIndex), endIndex: value.endIndex })
  const updateEnd = (endIndex: number) => onChange({ startIndex: value.startIndex, endIndex: Math.max(endIndex, value.startIndex) })
  return <section className='ai-chart-range' aria-label='Rango visible'>
    <div className='ai-chart-range-header'>
      <strong>Rango visible</strong>
      <button type='button' onClick={onReset}>Restablecer rango</button>
    </div>
    <div className='ai-chart-range-labels' aria-live='polite'>
      <span>{items[value.startIndex]?.label}</span>
      <span>{items[value.endIndex]?.label}</span>
    </div>
    <div className='ai-chart-range-track'>
      <input type='range' min='0' max={lastIndex} step='1' value={value.startIndex} aria-label='Inicio del rango visible' onChange={event => updateStart(Number(event.target.value))}/>
      <input type='range' min='0' max={lastIndex} step='1' value={value.endIndex} aria-label='Fin del rango visible' onChange={event => updateEnd(Number(event.target.value))}/>
    </div>
  </section>
}

export default ChartRangeControl
