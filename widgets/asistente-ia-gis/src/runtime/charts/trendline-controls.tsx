import { React } from 'jimu-core'

export type TrendlineMode = 'none' | 'linear' | 'moving-average' | 'polynomial'
export type MovingAverageWindow = 3 | 5 | 10
export type PolynomialDegree = 2 | 3

interface Props {
  mode: TrendlineMode
  allowMovingAverage?: boolean
  movingAverageWindow: MovingAverageWindow
  polynomialDegree: PolynomialDegree
  onModeChange: (mode: TrendlineMode) => void
  onMovingAverageWindowChange: (windowSize: MovingAverageWindow) => void
  onPolynomialDegreeChange: (degree: PolynomialDegree) => void
}

const Chip = ({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void }) => <button
  type='button'
  className={`ai-chart-chip${active ? ' active' : ''}`}
  aria-pressed={active}
  onClick={onClick}
>{children}</button>

const TrendlineControls = ({ mode, allowMovingAverage = true, movingAverageWindow, polynomialDegree, onModeChange, onMovingAverageWindowChange, onPolynomialDegreeChange }: Props) => <div className='ai-chart-trends'>
  <div className='ai-chart-trend-row'><span>Tendencia:</span>
    <Chip active={mode === 'none'} onClick={() => onModeChange('none')}>Sin tendencia</Chip>
    <Chip active={mode === 'linear'} onClick={() => onModeChange('linear')}>Lineal</Chip>
    {allowMovingAverage && <Chip active={mode === 'moving-average'} onClick={() => onModeChange('moving-average')}>Media móvil</Chip>}
    <Chip active={mode === 'polynomial'} onClick={() => onModeChange('polynomial')}>Polinómica</Chip>
  </div>
  {allowMovingAverage && mode === 'moving-average' && <div className='ai-chart-trend-row secondary'>
    {([3, 5, 10] as MovingAverageWindow[]).map(windowSize => <Chip key={windowSize} active={movingAverageWindow === windowSize} onClick={() => onMovingAverageWindowChange(windowSize)}>{windowSize} períodos</Chip>)}
  </div>}
  {mode === 'polynomial' && <div className='ai-chart-trend-row secondary'>
    {([2, 3] as PolynomialDegree[]).map(degree => <Chip key={degree} active={polynomialDegree === degree} onClick={() => onPolynomialDegreeChange(degree)}>Grado {degree}</Chip>)}
  </div>}
</div>

export default TrendlineControls