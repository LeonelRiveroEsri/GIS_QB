/* Local HTML/SVG chart builder and iframe security safeguards. */
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
const { buildChartHtml: buildChartHtmlDocument, escapeHtml } = loadTs(path.join(chartsRoot, 'chart-html-builder.ts'))
const { createChartPresentationState } = loadTs(path.join(chartsRoot, 'chart-presentation-state.ts'))
const chart = (chartType, overrides = {}) => ({
  id: 'same-chart-id', type: 'chart', title: 'Gráfico local', chartType, xField: 'fecha', yField: 'valor',
  data: [{ fecha: '01/01/2026', valor: 3 }, { fecha: '02/01/2026', valor: 5 }, { fecha: '03/01/2026', valor: 4 }],
  ...overrides
})
const buildChartHtml = (artifact, revision, presentation = createChartPresentationState(artifact)) => buildChartHtmlDocument(artifact, revision, presentation)

const line = buildChartHtml(chart('line'), 1)
const bar = buildChartHtml(chart('bar'), 1)
const scatter = buildChartHtml(chart('scatter'), 1)
const area = buildChartHtml(chart('area'), 1)
const histogram = buildChartHtml(chart('histogram'), 1)
const donut = buildChartHtml(chart('donut'), 1)
assert.match(line, /<polyline class="line"/) // A
assert.match(bar, /<rect class="bar mark"/) // B
assert.doesNotMatch(scatter, /<polyline class="line"/) // C
assert.match(scatter, /<circle class="point mark"/)
assert.match(area, /<polygon class="area"/) // D
assert.match(histogram, /Frecuencia/) // E
assert.match(donut, /class="donut-segment"/) // F

for (const html of [line, bar, scatter, area, histogram, donut]) {
  assert.match(html, /^<!doctype html>/) // G
  assert.match(html, /<html lang="es">/)
  assert.match(html, /Content-Security-Policy/)
  assert.doesNotMatch(html, /cdn\.|unpkg|jsdelivr|cdnjs/i) // H
  assert.doesNotMatch(html, /plotly\.com|cdn\.plot\.ly|Chart Studio/i) // I
  assert.doesNotMatch(html, /https?:\/\//i) // J
  assert.doesNotMatch(html, /\bNaN\b/) // M
  assert.doesNotMatch(html, /\bInfinity\b/) // N
}

const malicious = chart('line', {
  title: '<script>alert(1)</script>',
  xField: '"><img src=x onerror=alert(1)>',
  yField: "value' onmouseover='alert(1)",
  data: [{ '"><img src=x onerror=alert(1)>': '<script>x</script>', "value' onmouseover='alert(1)": 2 }]
})
const escaped = buildChartHtml(malicious, 2)
assert.doesNotMatch(escaped, /<script>/) // K
assert.doesNotMatch(escaped, /<img\s|onerror=['"]|onmouseover=['"]/) // L
assert.match(escaped, /&lt;script&gt;/)
assert.equal(escapeHtml('"<>&\''), '&quot;&lt;&gt;&amp;&#39;')

const invalidValues = buildChartHtml(chart('histogram', { data: [{ fecha: 'A', valor: Number.NaN }, { fecha: 'B', valor: Number.POSITIVE_INFINITY }] }), 3)
assert.match(invalidValues, /No hay valores numéricos válidos/)
assert.doesNotMatch(invalidValues, /\bNaN\b|\bInfinity\b/)
const empty = buildChartHtml(chart('line', { data: [] }), 4)
assert.match(empty, /No hay datos válidos para representar/) // O

const version1 = buildChartHtml(chart('line'), 1)
const version2 = buildChartHtml(chart('line', { data: [...chart('line').data, { fecha: '04/01/2026', valor: 8 }] }), 2)
assert.notEqual(version1, version2) // P, Q
assert.match(version2, /data-chart-revision="2"/)
assert.match(version2, /04\/01\/2026/)
assert.match(buildChartHtml(chart('line', { xField: 'periodo', data: [{ periodo: 'P1', valor: 2 }] }), 3), /periodo/) // R
assert.match(buildChartHtml(chart('line', { yField: 'total', data: [{ fecha: 'A', total: 7 }] }), 4), /total/) // S
assert.match(buildChartHtml(chart('bar'), 5), /<rect class="bar mark"/) // T
assert.match(buildChartHtml(chart('line', { title: 'Título actualizado' }), 6), /Título actualizado/) // U

const iframeView = fs.readFileSync(path.join(chartsRoot, 'chart-iframe-view.tsx'), 'utf8')
const workspace = fs.readFileSync(path.join(chartsRoot, 'chart-workspace.tsx'), 'utf8')
const widget = fs.readFileSync(path.join(widgetRoot, 'src/runtime/widget.tsx'), 'utf8')
const localUrlPolicy = fs.readFileSync(path.join(chartsRoot, 'local-chart-url.ts'), 'utf8')
assert.match(iframeView, /srcDoc=\{html\}/) // V
assert.match(iframeView, /sandbox='allow-scripts'/) // W
assert.doesNotMatch(iframeView, /allow-same-origin/) // X
assert.doesNotMatch(iframeView, /allow-popups/) // Y
assert.doesNotMatch(iframeView, /allow-downloads/) // Z
assert.match(iframeView, /key=\{`chart-html-\$\{revision\}`\}/)
assert.doesNotMatch(workspace, /buildChartHtml|ChartIframeView|chartHtml/)
assert.match(widget, /setChartWorkspaceState\(INITIAL_CHART_WORKSPACE_STATE\)/) // AA
assert.match(widget, /<ChartRenderer[\s\S]*artifact=\{artifact\}[\s\S]*presentationState=\{artifact === latestChartArtifact \? presentationState : undefined\}/) // AD
assert.match(workspace, /<PlotlyChartView artifact=\{latestChartArtifact\} revision=\{chartRevision\} presentationState=\{presentationState\} presentationModel=\{presentationModel\}/) // AE
assert.match(localUrlPolicy, /localhost/)
assert.match(localUrlPolicy, /127\.0\.0\.1/) // AF
const htmlSources = [fs.readFileSync(path.join(chartsRoot, 'chart-html-builder.ts'), 'utf8'), iframeView, workspace].join('\n')
assert.doesNotMatch(htmlSources, /fetch\(|XMLHttpRequest|WebSocket/) // AG
assert.doesNotMatch(fs.readFileSync(path.join(chartsRoot, 'chart-html-builder.ts'), 'utf8'), /from ['"](?!\.)/) // AH

console.log('Local chart HTML safeguards: A-AH passed')