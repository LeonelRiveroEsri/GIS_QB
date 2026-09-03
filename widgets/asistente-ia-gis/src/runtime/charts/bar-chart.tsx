import { React } from 'jimu-core'
import type { ChartMarksProps } from './chart-types'

const BarChart = ({ points, geometry }: ChartMarksProps) => {
  const barStep = geometry.plotWidth / points.length
  const barWidth = Math.max(1, barStep * 0.64)

  return <>{points.map((point, index) => {
    const top = geometry.y(point.value)
    return <rect
      key={`${point.label}-${index}`}
      className='ai-chart-bar'
      x={geometry.plotLeft + index * barStep + (barStep - barWidth) / 2}
      y={top}
      width={barWidth}
      height={Math.max(1, geometry.height - geometry.plotBottom - top)}
    />
  })}</>
}

export default BarChart