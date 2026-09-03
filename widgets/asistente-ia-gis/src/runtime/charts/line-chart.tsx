import { React } from 'jimu-core'
import type { ChartMarksProps } from './chart-types'

const LineChart = ({ points, geometry, trendPoints, projectionPoints }: ChartMarksProps) => {
  const linePoints = points.map((point, index) => `${geometry.x(index)},${geometry.y(point.value)}`).join(' ')
  const trendLinePoints = trendPoints?.map(point => `${geometry.x(point.index)},${geometry.y(point.value)}`).join(' ')
  const projectionX = (point: NonNullable<typeof projectionPoints>[number]) => point.xValue !== undefined && geometry.continuousX ? geometry.continuousX(point.xValue) : geometry.x(point.position)
  const projectionLinePoints = projectionPoints?.map(point => `${projectionX(point)},${geometry.y(point.value)}`).join(' ')

  return <>
    <polyline className='ai-chart-line' points={linePoints}/>
    {points.map((point, index) => <circle
      key={`${point.label}-${index}`}
      className='ai-chart-point'
      cx={geometry.x(index)}
      cy={geometry.y(point.value)}
      r='3'
    />)}
    {trendLinePoints && <>
      <polyline className='ai-chart-trendline' points={trendLinePoints}/>
      {trendPoints?.map(point => <circle key={`trend-${point.index}`} className='ai-chart-trend-point' cx={geometry.x(point.index)} cy={geometry.y(point.value)} r='2.5'/>) }
    </>}
    {projectionLinePoints && <>
      <polyline className='ai-chart-projection' points={projectionLinePoints}/>
      <text className='ai-chart-projection-label' x={projectionX(projectionPoints[projectionPoints.length - 1])} y={geometry.y(projectionPoints[projectionPoints.length - 1].value) - 7} textAnchor='end'>Proyección</text>
    </>}
  </>
}

export default LineChart