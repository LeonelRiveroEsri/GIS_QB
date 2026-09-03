import { React } from 'jimu-core'
import type { DonutResult } from './donut-calculations'

const COLORS = ['#005eb8', '#18864b', '#d47b00', '#7b61a8', '#008b95', '#c44569', '#5d7185', '#7a8f28']

const DonutChart = ({ result, title }: { result: DonutResult, title: string }) => {
  if (result.segments.length === 0) return <div className='ai-chart-empty'>No hay valores positivos válidos para construir el gráfico.</div>
  let offset = 0
  return <div className='ai-donut-layout'>
    <svg className='ai-donut-svg' viewBox='0 0 220 220' role='img' aria-label={`Gráfico donut: ${title}`}>
      <circle className='ai-donut-track' cx='110' cy='110' r='72'/>
      {result.segments.map((segment, index) => {
        const currentOffset = offset
        offset += segment.percentage
        return <circle
          key={segment.label}
          className='ai-donut-segment'
          cx='110'
          cy='110'
          r='72'
          pathLength='100'
          stroke={COLORS[index]}
          strokeDasharray={`${segment.percentage} ${100 - segment.percentage}`}
          strokeDashoffset={-currentOffset}
        />
      })}
      <text className='ai-donut-total' x='110' y='106' textAnchor='middle'>{result.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</text>
      <text className='ai-donut-caption' x='110' y='124' textAnchor='middle'>Total</text>
    </svg>
    <div className='ai-donut-legend'>
      {result.segments.map((segment, index) => <div key={segment.label} className='ai-donut-legend-item'>
        <i style={{ backgroundColor: COLORS[index] }}/>
        <span title={segment.label}>{segment.label}</span>
        <strong>{segment.percentage.toLocaleString(undefined, { maximumFractionDigits: 1 })}%</strong>
      </div>)}
    </div>
  </div>
}

export default DonutChart