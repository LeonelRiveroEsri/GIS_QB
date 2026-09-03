import type { ChartAgentArtifact } from '../../types/agent-artifact'
import { buildChartPresentationModel, type ChartPresentationModel } from './chart-presentation-model'
import type { ChartPresentationState } from './chart-presentation-state'
import { resolveTrendXValues } from './trendline-calculations'

const WIDTH = 640
const HEIGHT = 320
const PLOT = { left: 62, right: 22, top: 22, bottom: 62 }
const COLORS = ['#005EB8', '#006FD6', '#003B70', '#0057A8', '#B8D8F8', '#5D7185', '#17324D', '#EAF4FF']

export const escapeHtml = (value: unknown): string => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const formatNumber = (value: number): string => Number.isFinite(value)
  ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  : ''

const emptyChart = (message: string): string => `<div class="empty">${escapeHtml(message)}</div>`

const presentationSummary = (artifact: ChartAgentArtifact, presentation: ChartPresentationState): string => [
  presentation.trendType === 'none' ? undefined : `Tendencia: ${presentation.trendType === 'linear' ? 'Lineal' : presentation.trendType === 'moving-average' ? `Media móvil ${presentation.movingAverageWindow}` : `Polinómica grado ${presentation.polynomialDegree}`}`,
  presentation.segmentDays === null ? undefined : `Segmento: ${presentation.segmentDays} días`,
  presentation.projectionDays === null ? undefined : `Proyección: ${presentation.projectionDays} días`,
  artifact.chartType === 'histogram' && presentation.histogramBins !== 'auto' ? `Bins: ${presentation.histogramBins}` : undefined,
  artifact.chartType !== 'donut' ? undefined : presentation.donutMode === 'count' ? 'Agregación: Conteo' : presentation.donutValueField ? `Agregación: Suma de ${presentation.donutValueField}` : undefined
].filter(Boolean).join(' · ')

const svgDocument = (artifact: ChartAgentArtifact, revision: number, presentation: ChartPresentationState, visualization: string): string => `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; connect-src 'none'; font-src 'none'; form-action 'none'; frame-src 'none'; img-src 'none'; media-src 'none'; object-src 'none'; script-src 'none'; style-src 'unsafe-inline'">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(artifact.title)}</title>
  <style>
    *{box-sizing:border-box}html,body{min-height:100%;margin:0;background:#F4F9FE;color:#17324D;font-family:Segoe UI,Arial,sans-serif}body{padding:14px;overflow-x:hidden}.chart{max-width:900px;margin:0 auto}header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}h1{margin:0;color:#003B70;font-size:17px;line-height:1.3}.fields,.summary{margin:4px 0 0;color:#5D7185;font-size:11px}.summary{color:#003B70}.badge{flex:none;padding:4px 7px;border:1px solid #B8D8F8;border-radius:5px;background:#EAF4FF;color:#005EB8;font-size:10px;font-weight:700}svg{display:block;width:100%;height:auto;max-height:420px;background:white;border:1px solid #B8D8F8;border-radius:6px}.axis{stroke:#5D7185;stroke-width:1}.line{fill:none;stroke:#005EB8;stroke-width:2.5}.trend{fill:none;stroke:#0057A8;stroke-width:2;stroke-dasharray:6 4}.projection{fill:none;stroke:#5D7185;stroke-width:2;stroke-dasharray:4 4}.area{fill:#EAF4FF;stroke:none}.point{fill:#006FD6;stroke:white;stroke-width:1.5}.bar{fill:#005EB8}.mark{transition:opacity .12s ease,filter .12s ease}.mark:hover{opacity:.72;filter:brightness(1.08)}.label,.value,.axis-title{fill:#5D7185;font-size:10px}.axis-title{font-size:11px;font-weight:600}.empty{display:flex;min-height:230px;align-items:center;justify-content:center;padding:24px;border:1px solid #B8D8F8;border-radius:6px;background:white;color:#5D7185;text-align:center}.donut-layout{display:grid;grid-template-columns:minmax(180px,1fr) minmax(180px,1fr);gap:14px;align-items:center;padding:10px;border:1px solid #B8D8F8;border-radius:6px;background:white}.donut-layout svg{border:0}.donut-track{fill:none;stroke:#EAF4FF;stroke-width:30}.donut-segment{fill:none;stroke-width:30;transform:rotate(-90deg);transform-origin:center;transition:opacity .12s ease}.donut-segment:hover{opacity:.72}.legend{display:grid;gap:6px}.legend-item{display:grid;grid-template-columns:10px minmax(0,1fr) auto;gap:7px;align-items:center;font-size:11px}.legend-item i{width:10px;height:10px;border-radius:2px}.legend-item span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.legend-item strong{color:#003B70}@media(max-width:520px){body{padding:8px}header{display:grid}.badge{justify-self:start}.donut-layout{grid-template-columns:1fr}.label{font-size:9px}}
  </style>
</head>
<body data-chart-revision="${Number.isFinite(revision) ? Math.max(0, Math.trunc(revision)) : 0}">
  <main class="chart">
    <header><div><h1>${escapeHtml(artifact.title)}</h1><p class="fields">${escapeHtml(presentation.xField)} · ${escapeHtml(presentation.yField)}</p>${presentationSummary(artifact, presentation) ? `<p class="summary">${escapeHtml(presentationSummary(artifact, presentation))}</p>` : ''}</div><span class="badge">Generado localmente</span></header>
    ${visualization}
  </main>
</body>
</html>`

const cartesianChart = (artifact: ChartAgentArtifact, presentation: ChartPresentationState, model: ChartPresentationModel): string => {
  const points = model.points
  if (points.length === 0) return emptyChart('No hay datos válidos para representar.')
  const plotWidth = WIDTH - PLOT.left - PLOT.right
  const plotHeight = HEIGHT - PLOT.top - PLOT.bottom
  const visualValues = [...points.map(point => point.value), ...(model.trendline?.points.map(point => point.value) || []), ...(model.projection?.points.map(point => point.value) || [])]
  const minimum = Math.min(...visualValues)
  const maximum = Math.max(...visualValues)
  const range = maximum - minimum || 1
  const maximumPosition = model.projection?.points[model.projection.points.length - 1].position ?? Math.max(1, ...points.map((point, index) => point.sourceIndex ?? index))
  const scatterXValues = artifact.chartType === 'scatter' ? resolveTrendXValues(points) : []
  const scatterMinimum = scatterXValues.length > 0 ? Math.min(...scatterXValues) : 0
  const scatterMaximum = scatterXValues.length > 0 ? Math.max(...scatterXValues) : 1
  const scatterRange = scatterMaximum - scatterMinimum || 1
  const scatterLocalIndex = new Map(points.map((point, index) => [point.sourceIndex ?? index, index]))
  const x = (position: number): number => artifact.chartType === 'scatter'
    ? PLOT.left + (scatterXValues.length === 1 ? plotWidth / 2 : ((scatterXValues[position] ?? scatterMinimum) - scatterMinimum) * plotWidth / scatterRange)
    : PLOT.left + (points.length === 1 ? plotWidth / 2 : position * plotWidth / maximumPosition)
  const y = (value: number): number => PLOT.top + (maximum - value) * plotHeight / range
  const baseline = HEIGHT - PLOT.bottom
  const pointPosition = (point: typeof points[number], index: number): number => artifact.chartType === 'scatter' ? index : point.sourceIndex ?? index
  const positions = points.map((point, index) => `${x(pointPosition(point, index))},${y(point.value)}`).join(' ')
  const labelEvery = Math.max(1, Math.ceil(points.length / 6))
  const labels = points.map((point, index) => index % labelEvery === 0 || index === points.length - 1
    ? `<text class="label" x="${x(pointPosition(point, index))}" y="${HEIGHT - 31}" text-anchor="middle">${escapeHtml(point.label)}</text>`
    : '').join('')
  const tooltippedPoints = points.map((point, index) => `<circle class="point mark" cx="${x(pointPosition(point, index))}" cy="${y(point.value)}" r="4"><title>${escapeHtml(presentation.xField)}: ${escapeHtml(point.label)} · ${escapeHtml(presentation.yField)}: ${escapeHtml(formatNumber(point.value))}</title></circle>`).join('')
  let marks = `<polyline class="line" points="${positions}"/>${tooltippedPoints}`
  if (artifact.chartType === 'area') marks = `<polygon class="area" points="${x(0)},${baseline} ${positions} ${x(points.length - 1)},${baseline}"/><polyline class="line" points="${positions}"/>${tooltippedPoints}`
  if (artifact.chartType === 'scatter') marks = tooltippedPoints
  if (artifact.chartType === 'bar') {
    const step = plotWidth / points.length
    const barWidth = Math.max(1, step * 0.64)
    marks = points.map((point, index) => {
      const top = y(point.value)
      return `<rect class="bar mark" x="${PLOT.left + index * step + (step - barWidth) / 2}" y="${top}" width="${barWidth}" height="${Math.max(1, baseline - top)}"><title>${escapeHtml(presentation.xField)}: ${escapeHtml(point.label)} · ${escapeHtml(presentation.yField)}: ${escapeHtml(formatNumber(point.value))}</title></rect>`
    }).join('')
  }
  const trendPoints = model.trendline?.points.map(point => ({ x: x(artifact.chartType === 'scatter' ? scatterLocalIndex.get(point.index) ?? point.index : point.index), y: y(point.value) })) || []
  if (artifact.chartType === 'scatter') trendPoints.sort((left, right) => left.x - right.x)
  const trend = trendPoints.length > 0 ? `<polyline class="trend" points="${trendPoints.map(point => `${point.x},${point.y}`).join(' ')}"><title>${escapeHtml(presentation.trendType)}</title></polyline>` : ''
  const projection = model.projection ? `<polyline class="projection" points="${model.projection.points.map(point => `${x(point.position)},${y(point.value)}`).join(' ')}"><title>Proyección ${model.projection.days} días</title></polyline>` : ''
  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${escapeHtml(artifact.title)}">
    <line class="axis" x1="${PLOT.left}" y1="${PLOT.top}" x2="${PLOT.left}" y2="${baseline}"/><line class="axis" x1="${PLOT.left}" y1="${baseline}" x2="${WIDTH - PLOT.right}" y2="${baseline}"/>
    <text class="value" x="${PLOT.left - 7}" y="${PLOT.top + 4}" text-anchor="end">${escapeHtml(formatNumber(maximum))}</text><text class="value" x="${PLOT.left - 7}" y="${baseline}" text-anchor="end">${escapeHtml(formatNumber(minimum))}</text>
    ${marks}${trend}${projection}${labels}<text class="axis-title" x="${WIDTH / 2}" y="${HEIGHT - 8}" text-anchor="middle">${escapeHtml(presentation.xField)}</text><text class="axis-title" x="15" y="${HEIGHT / 2}" text-anchor="middle" transform="rotate(-90 15 ${HEIGHT / 2})">${escapeHtml(presentation.yField)}</text>
  </svg>`
}

const histogramChart = (artifact: ChartAgentArtifact, presentation: ChartPresentationState, model: ChartPresentationModel): string => {
  const result = model.histogram
  if (result.bins.length === 0) return emptyChart('No hay valores numéricos válidos para construir el histograma.')
  const plotWidth = WIDTH - PLOT.left - PLOT.right
  const plotHeight = HEIGHT - PLOT.top - PLOT.bottom
  const baseline = HEIGHT - PLOT.bottom
  const maximum = Math.max(1, ...result.bins.map(bin => bin.count))
  const step = plotWidth / result.bins.length
  const labelEvery = Math.max(1, Math.ceil(result.bins.length / 6))
  const bars = result.bins.map((bin, index) => {
    const height = bin.count * plotHeight / maximum
    const left = PLOT.left + index * step + 1
    const label = index % labelEvery === 0 || index === result.bins.length - 1 ? `<text class="label" x="${left + step / 2}" y="${HEIGHT - 31}" text-anchor="middle">${escapeHtml(bin.label)}</text>` : ''
    return `<rect class="bar mark" x="${left}" y="${baseline - height}" width="${Math.max(1, step - 2)}" height="${Math.max(1, height)}"><title>${escapeHtml(bin.label)} · Frecuencia: ${bin.count}</title></rect>${label}`
  }).join('')
  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${escapeHtml(artifact.title)}"><line class="axis" x1="${PLOT.left}" y1="${PLOT.top}" x2="${PLOT.left}" y2="${baseline}"/><line class="axis" x1="${PLOT.left}" y1="${baseline}" x2="${WIDTH - PLOT.right}" y2="${baseline}"/>${bars}<text class="axis-title" x="${WIDTH / 2}" y="${HEIGHT - 8}" text-anchor="middle">${escapeHtml(presentation.yField)}</text><text class="axis-title" x="15" y="${HEIGHT / 2}" text-anchor="middle" transform="rotate(-90 15 ${HEIGHT / 2})">Frecuencia</text></svg>`
}

const donutChart = (artifact: ChartAgentArtifact, model: ChartPresentationModel): string => {
  const result = model.donut
  if (result.segments.length === 0) return emptyChart('No hay valores positivos válidos para construir el gráfico donut.')
  let offset = 0
  const segments = result.segments.map((segment, index) => {
    const currentOffset = offset
    offset += segment.percentage
    return `<circle class="donut-segment" cx="110" cy="110" r="72" pathLength="100" stroke="${COLORS[index]}" stroke-dasharray="${segment.percentage} ${100 - segment.percentage}" stroke-dashoffset="${-currentOffset}"><title>${escapeHtml(segment.label)} · ${escapeHtml(formatNumber(segment.value))} · ${escapeHtml(formatNumber(segment.percentage))}%</title></circle>`
  }).join('')
  const legend = result.segments.map((segment, index) => `<div class="legend-item"><i style="background:${COLORS[index]}"></i><span title="${escapeHtml(segment.label)}">${escapeHtml(segment.label)}</span><strong>${escapeHtml(formatNumber(segment.percentage))}%</strong></div>`).join('')
  return `<div class="donut-layout"><svg viewBox="0 0 220 220" role="img" aria-label="${escapeHtml(artifact.title)}"><circle class="donut-track" cx="110" cy="110" r="72"/>${segments}<text x="110" y="106" text-anchor="middle" fill="#003B70" font-size="17" font-weight="700">${escapeHtml(formatNumber(result.total))}</text><text x="110" y="124" text-anchor="middle" class="label">Total</text></svg><div class="legend">${legend}</div></div>`
}

export const buildChartHtml = (artifact: ChartAgentArtifact, revision: number, presentation: ChartPresentationState): string => {
  const model = buildChartPresentationModel(artifact, presentation)
  const visualization = artifact.chartType === 'histogram'
    ? histogramChart(artifact, presentation, model)
    : artifact.chartType === 'donut'
      ? donutChart(artifact, model)
      : cartesianChart(artifact, presentation, model)
  return svgDocument(artifact, revision, presentation, visualization)
}