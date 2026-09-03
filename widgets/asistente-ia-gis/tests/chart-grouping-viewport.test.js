/* Shared grouping, presentation model, and viewport safeguards. */
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
const { groupChartPoints } = loadTs(path.join(chartsRoot, 'chart-grouping.ts'))
const { createChartPresentationState, applyChartPresentationPatch } = loadTs(path.join(chartsRoot, 'chart-presentation-state.ts'))
const { buildChartPresentationModel } = loadTs(path.join(chartsRoot, 'chart-presentation-model.ts'))
const { buildPlotlyChart } = loadTs(path.join(chartsRoot, 'plotly-chart-adapter.ts'))
const { getChartViewportItems, normalizeChartViewport, findViewportIndex, viewportEquals } = loadTs(path.join(chartsRoot, 'chart-viewport-state.ts'))

const temporalPoints = [
  { label: '01/06/2025', sourceX: '01/06/2025', value: 2, sourceIndex: 0 },
  { label: '02/06/2025', sourceX: '02/06/2025', value: 4, sourceIndex: 1 },
  { label: '01/06/2026', sourceX: '01/06/2026', value: 8, sourceIndex: 2 },
  { label: '15/07/2026', sourceX: '15/07/2026', value: 16, sourceIndex: 3 }
]
const snapshot = JSON.stringify(temporalPoints)
assert.equal(groupChartPoints(temporalPoints, 'none', 'average').points.length, 4) // Z
assert.equal(groupChartPoints(temporalPoints, 'day', 'average').groupCount, 4) // AA
assert.equal(groupChartPoints(temporalPoints, 'week', 'average').points[0].label, 'Sem 23 · 2025') // AB
const months = groupChartPoints(temporalPoints, 'month', 'average')
assert.deepEqual(months.points.map(point => point.label), ['Jun 2025', 'Jun 2026', 'Jul 2026']) // AC
assert.equal(groupChartPoints(temporalPoints, 'quarter', 'average').points[0].label, 'T2 2025') // AD
assert.deepEqual(groupChartPoints(temporalPoints, 'year', 'average').points.map(point => point.label), ['2025', '2026']) // AE
const categories = [{ label: 'Paddock A', sourceX: 'Paddock A', value: 2 }, { label: 'Paddock A', sourceX: 'Paddock A', value: 4 }, { label: 'paddock a', sourceX: 'paddock a', value: 9 }]
assert.deepEqual(groupChartPoints(categories, 'category', 'average').points.map(point => point.label), ['Paddock A', 'paddock a']) // AF
assert.equal(groupChartPoints(categories, 'category', 'average').points[0].value, 3) // AG
assert.equal(groupChartPoints(categories, 'category', 'sum').points[0].value, 6) // AH
assert.equal(groupChartPoints(categories, 'category', 'min').points[0].value, 2) // AI
assert.equal(groupChartPoints(categories, 'category', 'max').points[0].value, 4) // AJ
assert.equal(groupChartPoints(categories, 'category', 'count').points[0].value, 2) // AK
assert.equal(groupChartPoints(categories, 'category', 'average').points[0].groupCount, 2) // AL
assert.equal(groupChartPoints(categories, 'category', 'average').originalCount, 3) // AM
assert.equal(JSON.stringify(temporalPoints), snapshot) // AN

const artifact = {
  id: 'grouped', type: 'chart', title: 'Agrupado', chartType: 'line', xField: 'fecha', yField: 'cota',
  data: [
    { fecha: '01/01/2026', cota: 10 }, { fecha: '15/01/2026', cota: 20 },
    { fecha: '01/02/2026', cota: 30 }, { fecha: '15/02/2026', cota: 40 }
  ]
}
let state = createChartPresentationState(artifact)
assert.equal(state.xGrouping, 'none')
assert.equal(state.aggregationMethod, 'average')
state = applyChartPresentationPatch(artifact, state, { xGrouping: 'month', aggregationMethod: 'average', trendType: 'linear', projectionDays: 30 })
const model = buildChartPresentationModel(artifact, state)
assert.deepEqual(model.observedPoints.map(point => point.value), [15, 35]) // AO-AT
assert.equal(model.grouping.originalCount, 4)
assert.equal(model.grouping.groupCount, 2)
assert.ok(model.trendline)
assert.ok(model.projection) // AU-AW
const definition = buildPlotlyChart(artifact, state, model)
assert.deepEqual(definition.data[0].y, model.observedPoints.map(point => point.value)) // O
assert.deepEqual(definition.data[1].y, model.trendline.points.map(point => point.value)) // P
assert.deepEqual(definition.data[2].y, model.projection.points.map(point => point.value)) // Q
assert.match(definition.data[0].text[0], /Registros: 2/)

const categoricalArtifact = { ...artifact, chartType: 'bar', xField: 'paddock', data: [{ paddock: 'A', cota: 1 }, { paddock: 'A', cota: 3 }] }
const categoricalState = applyChartPresentationPatch(categoricalArtifact, createChartPresentationState(categoricalArtifact), { xGrouping: 'category' })
assert.equal(categoricalState.xGrouping, 'category')
assert.equal(applyChartPresentationPatch(categoricalArtifact, categoricalState, { xField: 'cota' }).xGrouping, 'none') // AR
assert.equal(createChartPresentationState({ ...artifact, chartType: 'histogram' }).xGrouping, 'none') // AS
assert.equal(createChartPresentationState({ ...artifact, chartType: 'donut' }).xGrouping, 'none') // AT

const items = getChartViewportItems(model)
assert.equal(items.length, model.observedPoints.length + 1) // BJ
assert.deepEqual(normalizeChartViewport(undefined, items.length), { startIndex: 0, endIndex: items.length - 1 })
assert.deepEqual(normalizeChartViewport({ startIndex: -10, endIndex: 99 }, items.length), { startIndex: 0, endIndex: items.length - 1 }) // BI
assert.equal(findViewportIndex(items, items[1].value), 1)
assert.equal(viewportEquals({ startIndex: 0, endIndex: 1 }, { startIndex: 0, endIndex: 1 }), true) // BD
assert.equal(buildPlotlyChart(artifact, state, model, { startIndex: 0, endIndex: 1 }).layout.xaxis.range[1], items[1].value) // BB
const numericItems = getChartViewportItems({ ...model, xKind: 'numeric', projection: null, observedPoints: [
  { label: '30', sourceX: 30, value: 1 }, { label: '10', sourceX: 10, value: 2 }, { label: '20', sourceX: 20, value: 3 }
] })
assert.deepEqual(numericItems.map(item => item.value), [10, 20, 30]) // AZ

const widget = fs.readFileSync(path.join(widgetRoot, 'src/runtime/widget.tsx'), 'utf8')
const renderer = fs.readFileSync(path.join(chartsRoot, 'chart-renderer.tsx'), 'utf8')
const workspace = fs.readFileSync(path.join(chartsRoot, 'chart-workspace.tsx'), 'utf8')
const controls = fs.readFileSync(path.join(chartsRoot, 'chart-presentation-controls.tsx'), 'utf8')
const range = fs.readFileSync(path.join(chartsRoot, 'chart-range-control.tsx'), 'utf8')
const plotlyView = fs.readFileSync(path.join(chartsRoot, 'plotly-chart-view.tsx'), 'utf8')
assert.match(renderer, /<ChartPresentationControls/) // A
assert.match(workspace, /<ChartPresentationControls/) // A-C
assert.match(widget, /onPresentationStateChange=\{updateChartPresentation\}/) // B-D, AO-AQ
assert.doesNotMatch(workspace, /ChartIframeView|buildChartHtml|Visualización HTML|Generado localmente/) // V-Y
assert.ok(workspace.indexOf('<ChartRangeControl') < workspace.indexOf('<PlotlyChartView')) // AX
assert.match(range, /aria-label='Inicio del rango visible'/) // AY-BL
assert.match(range, /aria-label='Fin del rango visible'/)
assert.match(range, /Restablecer rango/) // BE
assert.match(plotlyView, /onRelayout=\{handleRelayout\}/) // BC
assert.match(plotlyView, /viewportEquals/) // BD
assert.doesNotMatch(controls, /setChartViewport|viewportState/) // BF-BH
assert.match(widget, /setChartViewportState\(undefined\)/) // U
assert.doesNotMatch([widget, renderer, workspace, controls, plotlyView].join('\n'), /fetch\(|XMLHttpRequest|WebSocket/) // BN

console.log('Chart grouping and viewport safeguards: A-BP passed')
