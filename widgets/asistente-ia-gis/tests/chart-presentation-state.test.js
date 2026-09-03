/* Shared chart presentation state safeguards. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const cache = new Map()
const loadTs = file => {
  const resolved = path.resolve(file)
  if (cache.has(resolved)) return cache.get(resolved).exports
  const moduleInstance = { exports: {} }
  cache.set(resolved, moduleInstance)
  const source = fs.readFileSync(resolved, 'utf8')
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const localRequire = request => request.startsWith('.') ? loadTs(path.resolve(path.dirname(resolved), `${request}.ts`)) : require(request)
  Function('require', 'module', 'exports', output)(localRequire, moduleInstance, moduleInstance.exports)
  return moduleInstance.exports
}

const widgetRoot = path.resolve(__dirname, '..')
const chartsRoot = path.join(widgetRoot, 'src/runtime/charts')
const { applyChartPresentationPatch, createChartPresentationState } = loadTs(path.join(chartsRoot, 'chart-presentation-state.ts'))
const { buildChartPresentationModel } = loadTs(path.join(chartsRoot, 'chart-presentation-model.ts'))
const { applyChartArtifactVersion, INITIAL_CHART_WORKSPACE_STATE } = loadTs(path.join(chartsRoot, 'chart-workspace-state.ts'))
const { buildPlotlyChart } = loadTs(path.join(chartsRoot, 'plotly-chart-adapter.ts'))
const { buildChartHtml } = loadTs(path.join(chartsRoot, 'chart-html-builder.ts'))

const line = (overrides = {}) => ({
  id: 'active-chart', type: 'chart', title: 'Evolución', chartType: 'line', xField: 'fecha', yField: 'cota',
  data: [
    { fecha: '01/05/2026', cota: 8, volumen: 80, categoria: 'Anterior' },
    { fecha: '01/06/2026', cota: 10, volumen: 100, categoria: 'A' },
    { fecha: '08/06/2026', cota: 12, volumen: 120, categoria: 'B' },
    { fecha: '15/06/2026', cota: 14, volumen: 140, categoria: 'C' },
    { fecha: '21/06/2026', cota: 16, volumen: 160, categoria: 'D' }
  ],
  ...overrides
})

const original = line()
const plotlyFor = (artifact, state) => buildPlotlyChart(artifact, state, buildChartPresentationModel(artifact, state))
const originalSnapshot = JSON.stringify(original)
let presentation = createChartPresentationState(original)
assert.equal(presentation.xField, 'fecha')
assert.equal(presentation.yField, 'cota')
assert.equal(presentation.trendType, 'none') // A
assert.equal(presentation.xGrouping, 'none')
assert.equal(presentation.aggregationMethod, 'average')
presentation = applyChartPresentationPatch(original, presentation, { trendType: 'linear' })
assert.equal(presentation.trendType, 'linear') // B
presentation = applyChartPresentationPatch(original, presentation, { segmentDays: 30 })
assert.equal(presentation.segmentDays, 30) // C
presentation = applyChartPresentationPatch(original, presentation, { projectionDays: 60 })
assert.equal(presentation.projectionDays, 60) // D
presentation = applyChartPresentationPatch(original, presentation, { xField: 'fecha', yField: 'volumen' })
assert.equal(presentation.xField, 'fecha') // E
assert.equal(presentation.yField, 'volumen') // F

const histogram = line({ chartType: 'histogram' })
const histogramState = applyChartPresentationPatch(histogram, createChartPresentationState(histogram), { histogramBins: 10 })
assert.equal(histogramState.histogramBins, 10) // G
const donut = line({ chartType: 'donut', xField: 'categoria' })
let donutState = applyChartPresentationPatch(donut, createChartPresentationState(donut), { donutMode: 'count' })
assert.equal(donutState.donutMode, 'count') // H
donutState = applyChartPresentationPatch(donut, donutState, { donutMode: 'sum', donutValueField: 'volumen', yField: 'volumen' })
assert.equal(donutState.donutValueField, 'volumen')

const model = buildChartPresentationModel(original, presentation)
assert.equal(model.segment.totalSelected, 4)
assert.equal(model.segment.totalOriginal, 5)
assert.ok(model.trendline)
assert.ok(model.projection)
const plotly = plotlyFor(original, presentation)
assert.equal(plotly.data.length, 3) // N, Q, R
assert.match(plotly.data[1].name, /Tendencia lineal/) // N
assert.match(plotly.data[2].name, /Proyección 60 días/) // R
assert.equal(plotly.layout.xaxis.title.text, 'fecha')
assert.equal(plotly.layout.yaxis.title.text, 'volumen') // S
const movingState = applyChartPresentationPatch(original, presentation, { trendType: 'moving-average', movingAverageWindow: 3 })
assert.match(plotlyFor(original, movingState).data[1].name, /Media móvil 3/) // O
const polynomialState = applyChartPresentationPatch(original, presentation, { trendType: 'polynomial', polynomialDegree: 2 })
assert.match(plotlyFor(original, polynomialState).data[1].name, /Polinómica grado 2/) // P
const unorderedScatter = line({ chartType: 'scatter', xField: 'volumen', data: [
  { fecha: 'A', cota: 1, volumen: 30 },
  { fecha: 'Inválido', cota: Number.NaN, volumen: 20 },
  { fecha: 'B', cota: 2, volumen: 10 }
] })
const unorderedScatterState = applyChartPresentationPatch(unorderedScatter, createChartPresentationState(unorderedScatter), { trendType: 'linear' })
assert.deepEqual(plotlyFor(unorderedScatter, unorderedScatterState).data[1].x, [10, 30])
const html = buildChartHtml(original, 1, presentation)
assert.match(html, /Tendencia: Lineal/) // V
assert.match(html, /Segmento: 30 días/) // W
assert.match(html, /Proyección: 60 días/) // X
assert.match(html, /class="trend"/)
assert.match(html, /class="projection"/)
assert.match(buildChartHtml(histogram, 1, histogramState), /Bins: 10/) // Y
assert.match(buildChartHtml(donut, 1, donutState), /Agregación: Suma de volumen/) // Z
assert.match(buildChartHtml(unorderedScatter, 1, unorderedScatterState), /class="trend" points="62,258 618,22"/)
assert.equal(plotlyFor(histogram, histogramState).data[0].x.length, 10) // T
assert.equal(plotlyFor(donut, donutState).data[0].name, 'volumen') // U

const barState = createChartPresentationState(line({ chartType: 'bar' }), presentation)
assert.equal(barState.trendType, 'none')
assert.equal(barState.segmentDays, null)
assert.equal(barState.projectionDays, null) // AA
const scatterState = createChartPresentationState(line({ chartType: 'scatter' }), { ...presentation, projectionDays: 60 })
assert.equal(scatterState.projectionDays, null) // AB
const categoricalState = createChartPresentationState(line({ xField: 'categoria' }), { ...presentation, xField: 'categoria' })
assert.equal(categoricalState.segmentDays, null)
assert.equal(categoricalState.projectionDays, null) // AC

let workspaceState = applyChartArtifactVersion(INITIAL_CHART_WORKSPACE_STATE, original)
workspaceState = { ...workspaceState, presentationState: presentation }
workspaceState = applyChartArtifactVersion(workspaceState, line({ data: [...original.data, { fecha: '28/06/2026', cota: 18, volumen: 180, categoria: 'E' }] }))
assert.equal(workspaceState.presentationState.trendType, 'linear')
assert.equal(workspaceState.presentationState.segmentDays, 30)
assert.equal(workspaceState.presentationState.projectionDays, 60) // AD
const incompatible = applyChartArtifactVersion(workspaceState, line({ id: 'new-chart', chartType: 'bar' }))
assert.equal(incompatible.presentationState.trendType, 'none') // AE
assert.equal(JSON.stringify(original), originalSnapshot) // AF

const widget = fs.readFileSync(path.join(widgetRoot, 'src/runtime/widget.tsx'), 'utf8')
const renderer = fs.readFileSync(path.join(chartsRoot, 'chart-renderer.tsx'), 'utf8')
const workspace = fs.readFileSync(path.join(chartsRoot, 'chart-workspace.tsx'), 'utf8')
const sharedControls = fs.readFileSync(path.join(chartsRoot, 'chart-presentation-controls.tsx'), 'utf8')
assert.match(widget, /presentationState=\{artifact === latestChartArtifact \? presentationState : undefined\}/) // M, AG
assert.match(widget, /onPresentationStateChange=\{artifact === latestChartArtifact \? updateChartPresentation : undefined\}/)
assert.match(widget, /setChartWorkspaceState\(INITIAL_CHART_WORKSPACE_STATE\)/) // AH
const tabs = widget.match(/<nav className='ai-view-tabs'[\s\S]*?<\/nav>/)[0]
assert.doesNotMatch(tabs, /setChartWorkspaceState|presentationState/) // I, J
assert.doesNotMatch(renderer, /setTrendlineMode|setSelectedXField|setHistogramBins|setDonutValueField/)
assert.match(renderer, /<ChartPresentationControls/) // K
assert.match(workspace, /<ChartPresentationControls/) // L
assert.match(sharedControls, /xGrouping/)
assert.match(sharedControls, /aggregationMethod/)
assert.doesNotMatch(workspace, /ChartIframeView|buildChartHtml|Visualización HTML|Generado localmente/)
const sources = [widget, renderer, workspace, fs.readFileSync(path.join(chartsRoot, 'chart-presentation-model.ts'), 'utf8')].join('\n')
assert.doesNotMatch(sources, /fetch\(|XMLHttpRequest|WebSocket/) // AI
assert.match(widget, /handleAuthorizedAgentAction/) // AJ, AK remain wired and unchanged

console.log('Shared chart presentation state safeguards: A-AK passed')