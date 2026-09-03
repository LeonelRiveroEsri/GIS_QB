/* Local chart workspace navigation and iframe security safeguards. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const loadTs = file => {
  const source = fs.readFileSync(file, 'utf8')
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const moduleInstance = { exports: {} }
  Function('require', 'module', 'exports', output)(require, moduleInstance, moduleInstance.exports)
  return moduleInstance.exports
}

const widgetRoot = path.resolve(__dirname, '..')
const chartsRoot = path.join(widgetRoot, 'src/runtime/charts')
const widget = fs.readFileSync(path.join(widgetRoot, 'src/runtime/widget.tsx'), 'utf8')
const iframeView = fs.readFileSync(path.join(chartsRoot, 'chart-iframe-view.tsx'), 'utf8')
const workspace = fs.readFileSync(path.join(chartsRoot, 'chart-workspace.tsx'), 'utf8')
const mocks = fs.readFileSync(path.join(widgetRoot, 'src/services/mock-agent-client.ts'), 'utf8')
const { applyChartArtifactVersion, getChartArtifactKeys, getLatestChartArtifact, INITIAL_CHART_WORKSPACE_STATE } = loadTs(path.join(chartsRoot, 'chart-workspace-state.ts'))
const { isAllowedLocalChartUrl } = loadTs(path.join(chartsRoot, 'local-chart-url.ts'))

assert.match(widget, /React\.useState<ActiveView>\('chat'\)/) // A
assert.match(widget, />Chat<\/button>/)
assert.match(widget, />Gráficos\{hasNewChart/) // B

assert.deepEqual(getChartArtifactKeys([{ id: 'm1', artifacts: [{ id: 'c1', type: 'chart' }] }]), ['m1:c1']) // C
assert.deepEqual(getChartArtifactKeys([{ id: 'm2', artifacts: [{ id: 'p1', type: 'pdf' }] }]), []) // D
assert.match(widget, /setActiveView\('charts'\); setHasNewChart\(false\)/) // E
assert.match(widget, /if \(activeView === 'chat'\) setHasNewChart\(true\)/)
assert.match(widget, /setChartWorkspaceState\(current => applyChartArtifactVersion\(current, latestArtifact\)\)/)
assert.equal(getLatestChartArtifact([]), undefined)

const firstChart = { id: 'same', type: 'chart', title: 'A', chartType: 'line', xField: 'x', yField: 'y', data: [{ x: 1, y: 2 }] }
const updatedChart = { ...firstChart, data: [{ x: 1, y: 3 }, { x: 2, y: 4 }] }
const firstState = applyChartArtifactVersion(INITIAL_CHART_WORKSPACE_STATE, firstChart)
const updatedState = applyChartArtifactVersion(firstState, updatedChart)
assert.equal(firstState.latestChartArtifact, firstChart)
assert.equal(firstState.chartRevision, 1)
assert.equal(updatedState.latestChartArtifact, updatedChart)
assert.equal(updatedState.chartRevision, 2)
assert.equal(applyChartArtifactVersion(updatedState, updatedChart), updatedState)
assert.equal(getLatestChartArtifact([{ artifacts: [firstChart, updatedChart] }]), updatedChart)
assert.equal(getLatestChartArtifact([{ artifacts: [firstChart] }, { artifacts: [{ id: 'pdf', type: 'pdf', title: 'PDF' }] }]), firstChart)
const latestAfterNonChart = getLatestChartArtifact([{ artifacts: [updatedChart] }, { artifacts: [{ id: 'pdf', type: 'pdf', title: 'PDF' }] }])
assert.equal(applyChartArtifactVersion(updatedState, latestAfterNonChart), updatedState)

for (const trigger of ['chart', 'bar-chart', 'scatter-chart', 'area-chart', 'histogram-chart', 'donut-chart', 'chart-update-1', 'chart-update-2', 'chart-update-bar']) {
  assert.ok(mocks.includes(`[mock:${trigger}]`)) // F
}

assert.equal(isAllowedLocalChartUrl('http://localhost:3000/chart/a.html'), true) // G
assert.equal(isAllowedLocalChartUrl('https://127.0.0.1:8443/chart/a.html'), true) // H
assert.equal(isAllowedLocalChartUrl('https://example.com/chart/a.html'), false) // I
assert.equal(isAllowedLocalChartUrl('javascript:alert(1)'), false) // J
assert.equal(isAllowedLocalChartUrl('data:text/html,test'), false) // K
assert.equal(isAllowedLocalChartUrl('http://user:secret@localhost/chart/a.html'), false)
assert.equal(isAllowedLocalChartUrl('file:///chart/a.html'), false)

assert.match(iframeView, /if \(html\)/)
assert.ok(iframeView.indexOf('if (html)') < iframeView.indexOf('if (src && isAllowedLocalChartUrl(src))'))
assert.match(iframeView, /Sin visualización HTML/)
assert.match(iframeView, /No fue posible generar la visualización HTML\./) // L
assert.match(iframeView, /title=\{title\}/) // M
assert.match(iframeView, /sandbox='allow-scripts'/) // N
assert.doesNotMatch(iframeView, /allow-same-origin|allow-popups|allow-downloads|camera|microphone|geolocation|clipboard/)

assert.match(workspace, /Los gráficos generados durante la conversación aparecerán en este espacio\./)
assert.doesNotMatch(workspace, /ChartIframeView|chartHtml|Visualización HTML|Generado localmente/)
assert.match(workspace, /<ChartPresentationControls/)
assert.match(workspace, /<ChartRangeControl/)
assert.match(widget, /<main className='ai-conversation'/)
assert.match(widget, /<footer className='ai-composer'>/)
assert.match(widget, /<ChartRenderer[\s\S]*artifact=\{artifact\}[\s\S]*onPresentationStateChange=\{artifact === latestChartArtifact \? updateChartPresentation : undefined\}/) // O

assert.match(widget, /setChartWorkspaceState\(INITIAL_CHART_WORKSPACE_STATE\)/)
assert.match(widget, /setChartViewportState\(undefined\)/)
assert.doesNotMatch(widget, /seenChartArtifacts|containsNewChart/)
const synchronizationEffect = widget.match(/React\.useEffect\(\(\) => \{\s+const latestArtifact[\s\S]*?\}, \[messages, activeView, latestChartArtifact\]\)/)[0]
assert.doesNotMatch(synchronizationEffect, /setActiveView/)

console.log('Chart workspace safeguards: A-O passed')