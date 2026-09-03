import { React } from 'jimu-core'
import type { ChartAgentArtifact } from '../../types/agent-artifact'
import ChartAxisControls from './chart-axis-controls'
import { analyzeChartFields, selectChartXCandidates } from './chart-field-analysis'
import type { AggregationMethod, XGrouping } from './chart-grouping'
import type { ChartPresentationModel } from './chart-presentation-model'
import type { ChartPresentationPatch, ChartPresentationState } from './chart-presentation-state'
import DonutControls from './donut-controls'
import type { DonutValueField } from './donut-calculations'
import HistogramControls from './histogram-controls'
import ProjectionControls, { type ProjectionOption } from './projection-controls'
import { formatProjectionDate, slopePerDay } from './projection-calculations'
import TrendDataControls from './trend-data-controls'
import type { TrendDataMode } from './trend-data-segmentation'
import TrendlineControls from './trendline-controls'

interface Props {
  artifact: ChartAgentArtifact
  presentationState: ChartPresentationState
  presentationModel: ChartPresentationModel
  onPresentationStateChange: (patch: ChartPresentationPatch) => void
}

const PRESET_DAYS = [7, 30, 60, 90, 120]
const GROUPING_LABELS: Record<XGrouping, string> = {
  none: 'Sin agrupar', day: 'Día', week: 'Semana', month: 'Mes', quarter: 'Trimestre', year: 'Año', category: 'Categoría'
}
const AGGREGATION_LABELS: Record<AggregationMethod, string> = {
  average: 'Promedio', sum: 'Suma', min: 'Mínimo', max: 'Máximo', count: 'Conteo'
}

const Chip = ({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void }) => <button
  type='button'
  className={`ai-chart-chip${active ? ' active' : ''}`}
  aria-pressed={active}
  onClick={onClick}
>{children}</button>

const ChartPresentationControls = ({ artifact, presentationState, presentationModel, onPresentationStateChange }: Props) => {
  const fields = analyzeChartFields(artifact)
  const xCandidates = selectChartXCandidates(artifact.chartType, fields.xCandidates)
  const xKind = xCandidates.find(field => field.name === presentationState.xField)?.kind
  const supportsTrends = artifact.chartType === 'line' || artifact.chartType === 'area' || artifact.chartType === 'scatter'
  const supportsMovingAverage = artifact.chartType === 'line' || artifact.chartType === 'area'
  const supportsProjection = artifact.chartType === 'line' || artifact.chartType === 'area'
  const supportsGrouping = artifact.chartType === 'line' || artifact.chartType === 'area' || artifact.chartType === 'bar' || artifact.chartType === 'scatter'
  const groupingOptions: XGrouping[] = !supportsGrouping
    ? []
    : xKind === 'temporal'
      ? ['none', 'day', 'week', 'month', 'quarter', 'year']
      : xKind === 'categorical' ? ['none', 'category'] : ['none']
  const [customProjectionValue, setCustomProjectionValue] = React.useState(() => String(presentationState.projectionDays || 45))
  const [customProjectionError, setCustomProjectionError] = React.useState(false)
  const [customProjectionSelected, setCustomProjectionSelected] = React.useState(false)
  const [customTrendDataValue, setCustomTrendDataValue] = React.useState(() => String(presentationState.segmentDays || 60))
  const [customTrendDataError, setCustomTrendDataError] = React.useState(false)
  const [customTrendSelected, setCustomTrendSelected] = React.useState(false)
  const trendDataMode: TrendDataMode = customTrendSelected ? 'custom' : presentationState.segmentDays === null ? 'all' : PRESET_DAYS.includes(presentationState.segmentDays) ? presentationState.segmentDays as TrendDataMode : 'custom'
  const projectionOption: ProjectionOption = customProjectionSelected ? 'custom' : presentationState.projectionDays === null ? 'none' : PRESET_DAYS.includes(presentationState.projectionDays) ? presentationState.projectionDays as ProjectionOption : 'custom'
  const donutValueField: DonutValueField = presentationState.donutMode === 'count' ? 'count' : presentationState.donutValueField || presentationState.yField
  const projectionAvailable = supportsProjection && presentationState.trendType === 'linear' && presentationModel.temporalAxisValid && presentationModel.segment.points.length >= 2 && presentationModel.trendline?.slope !== undefined

  if (artifact.chartType === 'histogram') return <HistogramControls fields={fields.yCandidates} field={presentationState.yField} bins={presentationState.histogramBins} onFieldChange={yField => onPresentationStateChange({ yField })} onBinsChange={histogramBins => onPresentationStateChange({ histogramBins })}/>
  if (artifact.chartType === 'donut') return <DonutControls
    categories={xCandidates}
    values={fields.yCandidates}
    categoryField={presentationState.xField}
    mode={presentationState.donutMode}
    valueField={donutValueField}
    onCategoryChange={xField => onPresentationStateChange({ xField })}
    onModeChange={donutMode => onPresentationStateChange({ donutMode })}
    onValueFieldChange={field => onPresentationStateChange({ donutMode: 'sum', donutValueField: field, yField: field })}
  />

  return <div className='ai-chart-presentation-controls'>
    <ChartAxisControls
      xCandidates={xCandidates}
      yCandidates={fields.yCandidates}
      xField={presentationState.xField}
      yField={presentationState.yField}
      onXFieldChange={xField => onPresentationStateChange({ xField })}
      onYFieldChange={yField => onPresentationStateChange({ yField })}
    />
    {groupingOptions.length > 1 && <div className='ai-chart-grouping'>
      <div className='ai-chart-trend-row'><span>Agrupar X:</span>{groupingOptions.map(option => <Chip key={option} active={presentationState.xGrouping === option} onClick={() => onPresentationStateChange({ xGrouping: option })}>{GROUPING_LABELS[option]}</Chip>)}</div>
      {presentationState.xGrouping !== 'none' && <div className='ai-chart-trend-row secondary'><span>Agregación Y:</span>{(Object.keys(AGGREGATION_LABELS) as AggregationMethod[]).map(method => <Chip key={method} active={presentationState.aggregationMethod === method} onClick={() => onPresentationStateChange({ aggregationMethod: method })}>{AGGREGATION_LABELS[method]}</Chip>)}</div>}
    </div>}
    {supportsTrends && presentationModel.points.length > 0 && <>
      <TrendlineControls
        mode={presentationState.trendType}
        allowMovingAverage={supportsMovingAverage}
        movingAverageWindow={presentationState.movingAverageWindow}
        polynomialDegree={presentationState.polynomialDegree}
        onModeChange={trendType => {
          onPresentationStateChange({ trendType, projectionDays: null, ...(trendType === 'none' ? { segmentDays: null } : {}) })
          setCustomProjectionSelected(false)
          setCustomProjectionError(false)
          if (trendType === 'none') { setCustomTrendSelected(false); setCustomTrendDataError(false) }
        }}
        onMovingAverageWindowChange={movingAverageWindow => onPresentationStateChange({ movingAverageWindow })}
        onPolynomialDegreeChange={polynomialDegree => onPresentationStateChange({ polynomialDegree })}
      />
      {presentationState.trendType !== 'none' && presentationModel.temporalAxisValid && <TrendDataControls
        mode={trendDataMode}
        customValue={customTrendDataValue}
        customError={customTrendDataError}
        onModeChange={mode => {
          setCustomTrendSelected(mode === 'custom')
          setCustomTrendDataError(false)
          if (mode !== 'custom') onPresentationStateChange({ segmentDays: mode === 'all' ? null : mode, projectionDays: null })
          setCustomProjectionSelected(false)
        }}
        onCustomValueChange={value => { setCustomTrendDataValue(value); setCustomTrendDataError(false) }}
        onApplyCustom={days => {
          if (!Number.isFinite(days)) { setCustomTrendDataError(true); return }
          onPresentationStateChange({ segmentDays: days, projectionDays: null })
          setCustomTrendDataError(false)
          setCustomProjectionSelected(false)
        }}
      />}
      {supportsProjection && presentationState.trendType !== 'none' && !presentationModel.temporalAxisValid && <div className='ai-chart-temporal-notice'>Seleccione un campo de fecha en el eje X para habilitar segmentación temporal y proyecciones.</div>}
      {supportsProjection && presentationState.trendType === 'linear' && presentationModel.temporalAxisValid && <ProjectionControls
        option={projectionOption}
        customValue={customProjectionValue}
        customError={customProjectionError}
        disabled={!projectionAvailable}
        onOptionChange={option => {
          setCustomProjectionSelected(option === 'custom')
          if (option !== 'custom') onPresentationStateChange({ projectionDays: option === 'none' ? null : option })
          setCustomProjectionError(false)
        }}
        onCustomValueChange={value => { setCustomProjectionValue(value); setCustomProjectionError(false) }}
        onApplyCustom={days => {
          if (!Number.isFinite(days)) { setCustomProjectionError(true); return }
          onPresentationStateChange({ projectionDays: days })
          setCustomProjectionError(false)
        }}
      />}
      {presentationState.trendType !== 'none' && !presentationModel.trendline && <div className='ai-chart-trend-status'>{trendDataMode === 'all' ? 'No hay suficientes datos para calcular esta tendencia.' : 'No hay suficientes datos en el período seleccionado para calcular la tendencia.'}</div>}
    </>}
  </div>
}

export const ChartPresentationStatistics = ({ presentationState, presentationModel }: Pick<Props, 'presentationState' | 'presentationModel'>) => {
  const { grouping, segment, trendline, projection, temporalAxisValid } = presentationModel
  if (presentationState.trendType === 'none' && presentationState.xGrouping === 'none') return null
  return <div className='ai-chart-statistics'>
    {presentationState.xGrouping !== 'none' && <div className='ai-chart-model-summary'>
      <span>Agrupación: {GROUPING_LABELS[presentationState.xGrouping]}</span>
      <span>Agregación: {AGGREGATION_LABELS[presentationState.aggregationMethod]}</span>
      <span>Grupos: {grouping.groupCount}</span>
      <span>Registros originales: {grouping.originalCount}</span>
    </div>}
    {presentationState.trendType !== 'none' && <div className='ai-chart-model-summary'>
      <span>Modelo: {presentationState.trendType === 'linear' ? 'Lineal' : presentationState.trendType === 'moving-average' ? 'Media móvil' : 'Polinómica'}</span>
      <span>Datos utilizados: {presentationState.segmentDays === null ? 'Todos' : `${presentationState.segmentDays} días`}</span>
      <span>Registros: {segment.totalSelected} de {segment.totalOriginal}</span>
    </div>}
    {trendline && (trendline.rSquared !== undefined || trendline.slope !== undefined) && <div className='ai-chart-trend-metrics'>
      {trendline.rSquared !== undefined && <span>R²: {trendline.rSquared.toLocaleString('es-CL', { maximumFractionDigits: 4 })}</span>}
      {trendline.slope !== undefined && <span>{temporalAxisValid
        ? `Tendencia: ${(slopePerDay(trendline) ?? 0) >= 0 ? '+' : ''}${(slopePerDay(trendline) ?? 0).toLocaleString('es-CL', { maximumFractionDigits: 6 })} por día`
        : `Pendiente: ${trendline.slope.toLocaleString('es-CL', { maximumSignificantDigits: 4 })}`}</span>}
    </div>}
    {projection && <div className='ai-chart-projection-summary'>
      <span>Proyección: {projection.days} días</span>
      <span>Hasta: {formatProjectionDate(projection.endDate)}</span>
      <span>Valor estimado: {projection.estimatedValue.toLocaleString('es-CL', { maximumFractionDigits: 4 })}</span>
    </div>}
  </div>
}

export default ChartPresentationControls
