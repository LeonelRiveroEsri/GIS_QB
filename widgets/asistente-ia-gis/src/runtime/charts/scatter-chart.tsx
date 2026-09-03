import { React } from 'jimu-core'
import type { ChartMarksProps } from './chart-types'

const ScatterChart = ({ points, geometry, trendPoints }: ChartMarksProps) => {
  const localIndexBySourceIndex = new Map(points.map((point, index) => [point.sourceIndex ?? index, index]))
  const trendLinePoints = trendPoints
    ?.map(point => ({ ...point, x: geometry.x(localIndexBySourceIndex.get(point.index) ?? point.index) }))
    .sort((left, right) => left.x - right.x)
    .map(point => `${point.x},${geometry.y(point.value)}`)
    .join(' ')

  return <>
    {points.map((point, index) => <circle
      key={`${point.label}-${index}`}
      className='ai-chart-scatter-point'
      cx={geometry.x(index)}
      cy={geometry.y(point.value)}
      r='3.5'
    />)}
    {trendLinePoints && <polyline className='ai-chart-trendline' points={trendLinePoints}/>}
  </>
}

export default ScatterChart