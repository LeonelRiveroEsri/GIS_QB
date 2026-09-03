/* Scatter chart behavior and architecture safeguards. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const cache = new Map()
const loadTs = (file) => {
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

const root = path.resolve(__dirname, '../src/runtime/charts')
const { analyzeChartFields, selectChartXCandidates } = loadTs(path.join(root, 'chart-field-analysis.ts'))
const { normalizeChartPoints } = loadTs(path.join(root, 'chart-points.ts'))
const { calculateLinearTrend, calculatePolynomialTrend } = loadTs(path.join(root, 'trendline-calculations.ts'))
const { segmentTrendData } = loadTs(path.join(root, 'trend-data-segmentation.ts'))
const renderer = fs.readFileSync(path.join(root, 'chart-renderer.tsx'), 'utf8')
const scatter = fs.readFileSync(path.join(root, 'scatter-chart.tsx'), 'utf8')
const controls = fs.readFileSync(path.join(root, 'trendline-controls.tsx'), 'utf8')
const presentationControls = fs.readFileSync(path.join(root, 'chart-presentation-controls.tsx'), 'utf8')

const artifact = {
  id: 'scatter', type: 'chart', title: 'Relación', chartType: 'scatter', xField: 'superficie', yField: 'volumen',
  data: [
    { fecha: '01/06/2026', superficie: 10, volumen: 100, paddock: 'A' },
    { fecha: '08/06/2026', superficie: 20, volumen: 205, paddock: 'B' },
    { fecha: '15/06/2026', superficie: 30, volumen: 295, paddock: 'C' },
    { fecha: 'inválida', superficie: 'n/a', volumen: 400, paddock: 'D' }
  ]
}
const analysis = analyzeChartFields(artifact)
const xCandidates = selectChartXCandidates('scatter', analysis.xCandidates)
assert.equal(xCandidates[0].kind, 'numeric') // C
assert.equal(xCandidates.some(field => field.kind === 'categorical'), false)
assert.equal(xCandidates.some(field => field.name === 'fecha' && field.kind === 'temporal'), true)
assert.equal(analysis.yCandidates.every(field => field.kind === 'numeric'), true) // D
assert.ok(xCandidates.length > 1 && analysis.yCandidates.length > 1) // E

const points = normalizeChartPoints(artifact, 'superficie', 'volumen', 'numeric')
assert.equal(points.length, 3) // F, G
assert.ok(calculateLinearTrend(points)) // H
assert.ok(calculatePolynomialTrend(points, 2)) // I
assert.match(presentationControls, /allowMovingAverage=\{supportsMovingAverage\}/)
assert.match(controls, /allowMovingAverage && <Chip[^>]+moving-average/) // J
assert.match(presentationControls, /const supportsProjection = artifact\.chartType === 'line' \|\| artifact\.chartType === 'area'/) // K
assert.doesNotMatch(scatter, /projection|Proyección/i)

const temporalPoints = normalizeChartPoints(artifact, 'fecha', 'volumen', 'temporal')
assert.equal(segmentTrendData(temporalPoints, 7).temporal, true) // L
assert.match(presentationControls, /presentationState\.trendType !== 'none' && presentationModel\.temporalAxisValid && <TrendDataControls/)
assert.match(scatter, /points\.map\(\(point, index\) => <circle/)
assert.doesNotMatch(scatter, /ai-chart-line/)

console.log('Scatter chart safeguards: C-L passed')