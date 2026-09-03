/* Lightweight runtime contract tests. Run with Node from C:\EXP\client. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const cache = new Map()
const loadTs = (file) => {
  const resolved = path.resolve(file)
  if (cache.has(resolved)) return cache.get(resolved).exports
  const module = { exports: {} }
  cache.set(resolved, module)
  const source = fs.readFileSync(resolved, 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText
  const localRequire = (request) => request.startsWith('.')
    ? loadTs(path.resolve(path.dirname(resolved), `${request}.ts`))
    : require(request)
  Function('require', 'module', 'exports', output)(localRequire, module, module.exports)
  return module.exports
}

const widgetRoot = path.resolve(__dirname, '..')
const { validateAgentResponse } = loadTs(path.join(widgetRoot, 'src/validation/agent-response-validator.ts'))
const { createMalformedAgentResponseMock } = loadTs(path.join(widgetRoot, 'src/services/raw-agent-response-mocks.ts'))
const { MAX_CHART_POINTS } = loadTs(path.join(widgetRoot, 'src/validation/validation-limits.ts'))
const { applyChartArtifactVersion, INITIAL_CHART_WORKSPACE_STATE } = loadTs(path.join(widgetRoot, 'src/runtime/charts/chart-workspace-state.ts'))

const base = () => ({
  schemaVersion: '1.0',
  requestId: 'request-1',
  conversationId: 'conversation-1',
  status: 'completed',
  message: 'Respuesta válida'
})
const action = (overrides = {}) => ({ id: 'action-1', title: 'Acción', type: 'zoom_to_layer', layerId: 'layer-1', ...overrides })
const artifact = (overrides = {}) => ({ id: 'artifact-1', title: 'Informe', type: 'pdf', url: 'https://example.test/report.pdf', ...overrides })
const chart = (overrides = {}) => ({ id: 'chart-1', title: 'Gráfico', type: 'chart', chartType: 'line', xField: 'fecha', yField: 'valor', data: [{ fecha: '01/06/2026', valor: 1 }], ...overrides })
const accepted = (value) => assert.equal(validateAgentResponse(value).success, true)
const rejected = (value) => assert.equal(validateAgentResponse(value).success, false)

accepted(base()) // A
accepted({ ...base(), actions: [{ id: 'zoom-1', title: 'Zoom', type: 'zoom_to_extent', extent: { xmin: 1, ymin: 2, xmax: 3, ymax: 4 } }] }) // B
rejected({ ...base(), actions: [action({ type: 'delete_everything' })] }) // C
rejected({ ...base(), actions: [action({ type: 'set_layer_visibility', visible: 'true' })] }) // D
rejected({ ...base(), actions: [{ id: 'zoom-1', title: 'Zoom', type: 'zoom_to_extent', extent: { xmin: Number.NaN, ymin: 2, xmax: 3, ymax: 4 } }] }) // E
rejected({ ...base(), actions: [{ id: 'zoom-1', title: 'Zoom', type: 'zoom_to_extent', extent: { xmin: 4, ymin: 2, xmax: 3, ymax: 4 } }] }) // F
accepted({ ...base(), actions: [action({ type: 'open_url', url: 'https://example.test' })] }) // G
rejected({ ...base(), actions: [action({ type: 'open_url', url: 'javascript:alert(1)' })] }) // H
accepted({ ...base(), artifacts: [artifact()] }) // I
const sanitizedArtifact = validateAgentResponse({ ...base(), artifacts: [artifact({ url: 'https://example.test/report.pdf?token=secret&format=pdf' })] })
assert.equal(sanitizedArtifact.success, true)
assert.equal(sanitizedArtifact.value.artifacts[0].url.includes('token='), false)
rejected({ ...base(), artifacts: [artifact({ url: 'ftp://example.test/report.pdf' })] }) // J
rejected({ ...base(), artifacts: [artifact({ type: 'executable' })] }) // K
rejected({ ...base(), artifacts: [artifact({ metadata: { nested: { value: true } } })] }) // L
for (const key of ['__proto__', 'constructor', 'prototype']) {
  const metadata = JSON.parse(`{"${key}":"blocked"}`)
  rejected({ ...base(), artifacts: [artifact({ metadata })] })
} // M
rejected({ ...base(), actions: Array.from({ length: 21 }, (_, index) => action({ id: `action-${index}` })) }) // N
const normalized = validateAgentResponse({ ...base(), unexpected: 'discard me' })
assert.equal(normalized.success, true)
assert.equal(Object.prototype.hasOwnProperty.call(normalized.value, 'unexpected'), false) // O
rejected({ ...base(), schemaVersion: '2.0' }) // P
rejected({ ...base(), status: 'unknown' }) // Q

accepted({ ...base(), artifacts: [chart()] }) // R, chart line válido
accepted({ ...base(), artifacts: [chart({ chartType: 'bar' })] }) // S, chart bar válido
accepted({ ...base(), artifacts: [chart({ chartType: 'scatter' })] })
accepted({ ...base(), artifacts: [chart({ chartType: 'area' })] })
accepted({ ...base(), artifacts: [chart({ chartType: 'histogram' })] })
accepted({ ...base(), artifacts: [chart({ chartType: 'donut' })] })
rejected({ ...base(), artifacts: [chart({ chartType: 'scatter', data: {} })] })
for (const chartType of ['pie', 'radar', 'heatmap', 'stacked_bar', 'boxplot', 'unknown']) rejected({ ...base(), artifacts: [chart({ chartType })] }) // T, Z
rejected({ ...base(), artifacts: [chart({ xField: '' })] }) // U
rejected({ ...base(), artifacts: [chart({ yField: '' })] }) // V
rejected({ ...base(), artifacts: [chart({ data: {} })] }) // W
rejected({ ...base(), artifacts: [chart({ data: Array.from({ length: MAX_CHART_POINTS + 1 }, (_, index) => ({ fecha: index, valor: index })) })] }) // X
accepted({ ...base(), artifacts: [chart({ data: Array.from({ length: MAX_CHART_POINTS }, (_, index) => ({ fecha: index, valor: index })) })] })
accepted({ ...base(), artifacts: [artifact()] }) // Y, pdf conserva compatibilidad
for (const type of ['link', 'table', 'map', 'image']) accepted({ ...base(), artifacts: [artifact({ type, url: undefined })] }) // Z
rejected({ ...base(), artifacts: [chart({ id: '' })] })
rejected({ ...base(), artifacts: [chart({ title: '' })] })

const validChart = validateAgentResponse({ ...base(), artifacts: [chart()] })
const activeChartState = applyChartArtifactVersion(INITIAL_CHART_WORKSPACE_STATE, validChart.value.artifacts[0])
const invalidChart = validateAgentResponse({ ...base(), artifacts: [chart({ chartType: 'radar' })] })
const retainedChartState = invalidChart.success
  ? applyChartArtifactVersion(activeChartState, invalidChart.value.artifacts[0])
  : activeChartState
assert.equal(retainedChartState, activeChartState)
assert.equal(retainedChartState.chartRevision, 1)

for (const scenario of ['invalid-action', 'invalid-url', 'invalid-artifact', 'oversized']) {
  rejected(createMalformedAgentResponseMock(scenario))
}

console.log('Agent response validator: A-Z passed')
