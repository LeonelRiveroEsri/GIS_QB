import { React } from 'jimu-core'
import type { HistogramResult } from './histogram-calculations'

const WIDTH = 560
const HEIGHT = 220
const PLOT = { left: 48, right: 14, top: 20, bottom: 48 }

const HistogramChart = ({ result, title }: { result: HistogramResult, title: string }) => {
  if (result.bins.length === 0) return <div className='ai-chart-empty'>No hay valores numéricos válidos para construir el histograma.</div>
  const plotWidth = WIDTH - PLOT.left - PLOT.right
  const plotHeight = HEIGHT - PLOT.top - PLOT.bottom
  const maximum = Math.max(1, ...result.bins.map(bin => bin.count))
  const step = plotWidth / result.bins.length
  const labelEvery = Math.max(1, Math.ceil(result.bins.length / 6))

  return <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role='img' aria-label={`Histograma: ${title}`}>
    <line className='ai-chart-axis' x1={PLOT.left} y1={PLOT.top} x2={PLOT.left} y2={HEIGHT - PLOT.bottom}/>
    <line className='ai-chart-axis' x1={PLOT.left} y1={HEIGHT - PLOT.bottom} x2={WIDTH - PLOT.right} y2={HEIGHT - PLOT.bottom}/>
    {result.bins.map((bin, index) => {
      const height = bin.count * plotHeight / maximum
      const x = PLOT.left + index * step + 1
      const y = HEIGHT - PLOT.bottom - height
      return <React.Fragment key={`${bin.minimum}-${bin.maximum}`}>
        <rect className='ai-chart-bar' x={x} y={y} width={Math.max(1, step - 2)} height={Math.max(1, height)}/>
        <text className='ai-chart-value' x={x + step / 2} y={Math.max(PLOT.top + 9, y - 4)} textAnchor='middle'>{bin.count}</text>
        {(index % labelEvery === 0 || index === result.bins.length - 1) && <text className='ai-chart-label' x={x + step / 2} y={HEIGHT - 21} textAnchor='middle'>{bin.label}</text>}
      </React.Fragment>
    })}
  </svg>
}

export default HistogramChart