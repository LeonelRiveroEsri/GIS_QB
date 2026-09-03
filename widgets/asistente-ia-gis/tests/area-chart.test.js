/* Area chart behavior and architecture safeguards. */
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
const { calculateLinearTrend, calculateMovingAverage, calculatePolynomialTrend } = loadTs(path.join(root, 'trendline-calculations.ts'))
const { segmentTrendData } = loadTs(path.join(root, 'trend-data-segmentation.ts'))
const renderer = fs.readFileSync(path.join(root, 'chart-renderer.tsx'), 'utf8')
const area = fs.readFileSync(path.join(root, 'area-chart.tsx'), 'utf8')
const presentationControls = fs.readFileSync(path.join(root, 'chart-presentation-controls.tsx'), 'utf8')

const artifact = {
  id: 'area', type: 'chart', title: 'Evolución', chartType: 'area', xField: 'fecha', yField: 'superficie',
  data: [
    { fecha: '01/06/2026', superficie: 10, volumen: 100, categoría: 'A' },
    { fecha: '08/06/2026', superficie: 12, volumen: 110, categoría: 'B' },
    { fecha: '15/06/2026', superficie: 15, volumen: 125, categoría: 'C' }
  ]
}
const analysis = analyzeChartFields(artifact)
assert.deepEqual(selectChartXCandidates('area', analysis.xCandidates), analysis.xCandidates) // O
assert.ok(analysis.yCandidates.length > 1)
const points = normalizeChartPoints(artifact, 'fecha', 'superficie', 'temporal') // N
assert.equal(points.length, artifact.data.length)
assert.ok(calculateLinearTrend(points)) // P
assert.ok(calculateMovingAverage(points, 3)) // Q
assert.ok(calculatePolynomialTrend(points, 2)) // R
assert.equal(segmentTrendData(points, 7).temporal, true) // S
assert.match(presentationControls, /const supportsProjection = artifact\.chartType === 'line' \|\| artifact\.chartType === 'area'/) // T
assert.match(renderer, /<AreaChart[^>]+projectionPoints=\{projection\?\.points\}/)
assert.match(area, /const areaPoints = `\$\{geometry\.x\(0\)\},\$\{baseline\} \$\{observedPoints\} \$\{geometry\.x\(points\.length - 1\)\},\$\{baseline\}`/) // U
assert.doesNotMatch(area, /areaPoints[^\n]+projection/)
assert.match(presentationControls, /supportsProjection && presentationState\.trendType !== 'none' && !presentationModel\.temporalAxisValid/) // V
assert.match(presentationControls, /allowMovingAverage=\{supportsMovingAverage\}/)

console.log('Area chart safeguards: N-V passed')