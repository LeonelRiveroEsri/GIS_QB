/* Plotly artifact adapter and workspace integration safeguards. */
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
const { buildPlotlyChart: buildPlotlyChartDefinition } = loadTs(path.join(chartsRoot, 'plotly-chart-adapter.ts'))
const { createChartPresentationState } = loadTs(path.join(chartsRoot, 'chart-presentation-state.ts'))
const { buildChartPresentationModel } = loadTs(path.join(chartsRoot, 'chart-presentation-model.ts'))
const { applyChartArtifactVersion, getLatestChartArtifact, INITIAL_CHART_WORKSPACE_STATE } = loadTs(path.join(chartsRoot, 'chart-workspace-state.ts'))
const chart = (chartType, overrides = {}) => ({
  id: `${chartType}-1`, type: 'chart', title: chartType, chartType, xField: 'category', yField: 'value',
  data: [{ category: 'A', value: 1 }, { category: 'B', value: 2 }],
  ...overrides
})
const buildPlotlyChart = artifact => {
  const presentation = createChartPresentationState(artifact)
  return buildPlotlyChartDefinition(artifact, presentation, buildChartPresentationModel(artifact, presentation))
}

assert.equal(buildPlotlyChart(chart('line')).data[0].type, 'scatter')
assert.equal(buildPlotlyChart(chart('line')).data[0].mode, 'lines+markers') // A
assert.equal(buildPlotlyChart(chart('bar')).data[0].type, 'bar') // B
assert.equal(buildPlotlyChart(chart('scatter')).data[0].mode, 'markers') // C
assert.equal(buildPlotlyChart(chart('area')).data[0].fill, 'tozeroy') // D
assert.equal(buildPlotlyChart(chart('histogram')).data[0].type, 'bar') // E
const donut = buildPlotlyChart(chart('donut'))
assert.equal(donut.data[0].type, 'pie')
assert.ok(donut.data[0].hole > 0) // F

assert.equal(buildPlotlyChart(chart('line', { data: [] })), null) // G
const filtered = buildPlotlyChart(chart('line', { data: [
  { category: 'A', value: Number.NaN },
  { category: 'B', value: Number.POSITIVE_INFINITY },
  { category: 'C', value: 3 }
] }))
assert.deepEqual(filtered.data[0].y, [3]) // H, I
assert.equal(buildPlotlyChart(chart('bar', { xField: 'missing' })), null) // J

const first = chart('line')
const latest = chart('bar')
assert.equal(getLatestChartArtifact([{ artifacts: [first] }, { artifacts: [latest] }]), latest) // K
assert.equal(getLatestChartArtifact([]), undefined) // L
assert.equal(getLatestChartArtifact([{ artifacts: [first] }, { artifacts: [{ id: 'pdf', type: 'pdf', title: 'PDF' }] }]), first) // M

const sameIdDataUpdate = chart('line', { id: first.id, data: [{ category: 'A', value: 8 }, { category: 'B', value: 13 }, { category: 'C', value: 21 }] })
const dataDefinition = buildPlotlyChart(sameIdDataUpdate)
assert.deepEqual(dataDefinition.data[0].y, [8, 13, 21])
assert.equal(dataDefinition.data.length, 1)
const xFieldUpdate = chart('line', { id: first.id, xField: 'period', data: [{ period: 'P1', value: 4 }] })
assert.deepEqual(buildPlotlyChart(xFieldUpdate).data[0].x, ['P1'])
assert.equal(buildPlotlyChart(xFieldUpdate).layout.xaxis.title.text, 'period')
const yFieldUpdate = chart('line', { id: first.id, yField: 'total', data: [{ category: 'A', total: 7 }] })
assert.deepEqual(buildPlotlyChart(yFieldUpdate).data[0].y, [7])
assert.equal(buildPlotlyChart(yFieldUpdate).layout.yaxis.title.text, 'total')
assert.equal(buildPlotlyChart(chart('line', { title: 'Título actualizado' })).layout.title.text, 'Título actualizado')
assert.equal(buildPlotlyChart(chart('bar', { id: first.id })).data[0].type, 'bar')

let state = applyChartArtifactVersion(INITIAL_CHART_WORKSPACE_STATE, first)
for (const update of [sameIdDataUpdate, xFieldUpdate, yFieldUpdate, chart('bar', { id: first.id }), chart('line', { id: first.id, title: 'Sólo título nuevo' }), chart('line', { id: 'different' })]) {
  state = applyChartArtifactVersion(state, update)
}
assert.equal(state.chartRevision, 7)
assert.equal(state.latestChartArtifact.id, 'different')

const widget = fs.readFileSync(path.join(widgetRoot, 'src/runtime/widget.tsx'), 'utf8')
const workspace = fs.readFileSync(path.join(chartsRoot, 'chart-workspace.tsx'), 'utf8')
const plotlyView = fs.readFileSync(path.join(chartsRoot, 'plotly-chart-view.tsx'), 'utf8')
const iframeView = fs.readFileSync(path.join(chartsRoot, 'chart-iframe-view.tsx'), 'utf8')
const mocks = fs.readFileSync(path.join(widgetRoot, 'src/services/mock-agent-client.ts'), 'utf8')
for (const trigger of ['chart', 'bar-chart', 'scatter-chart', 'area-chart', 'histogram-chart', 'donut-chart']) assert.ok(mocks.includes(`[mock:${trigger}]`)) // N
assert.doesNotMatch(workspace, /ChartIframeView|chartHtml|Visualización HTML/) // O
assert.match(widget, /<ChartRenderer[\s\S]*artifact=\{artifact\}[\s\S]*presentationState=\{artifact === latestChartArtifact \? presentationState : undefined\}/) // P
assert.match(widget, /setChartWorkspaceState\(INITIAL_CHART_WORKSPACE_STATE\)/)
assert.match(workspace, /React\.lazy\(async \(\) => import\('\.\/plotly-chart-view'\)\)/)
assert.match(workspace, /<PlotlyChartView artifact=\{latestChartArtifact\} revision=\{chartRevision\} presentationState=\{presentationState\} presentationModel=\{presentationModel\}/)
assert.match(plotlyView, /buildPlotlyChart\(artifact, presentationState, presentationModel, viewportState\)/)
assert.match(plotlyView, /key=\{revision\}/)
assert.match(plotlyView, /uirevision: revision/)
assert.match(plotlyView, /revision=\{revision\}/)
assert.match(plotlyView, /onRelayout=\{handleRelayout\}/)

const plotlySources = [widget, workspace, plotlyView, fs.readFileSync(path.join(chartsRoot, 'plotly-chart-adapter.ts'), 'utf8')].join('\n')
assert.doesNotMatch(plotlySources, /fetch\(|XMLHttpRequest|WebSocket/) // Q
assert.doesNotMatch(plotlySources, /cdn\.|unpkg|jsdelivr|plotly\.com/i) // R
assert.doesNotMatch(plotlySources, /Chart Studio|chart_studio/i) // S
assert.equal(buildPlotlyChart(chart('line')).config.responsive, true) // T
assert.equal(buildPlotlyChart(chart('line')).config.displaylogo, false) // U
assert.match(plotlyView, /useResizeHandler/)
assert.match(iframeView, /sandbox='allow-scripts'/)
assert.match(iframeView, /artifact\?: ChartAgentArtifact/)
assert.match(iframeView, /revision\?: number/)

console.log('Plotly chart adapter safeguards: A-U passed')