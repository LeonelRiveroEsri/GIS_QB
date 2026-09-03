/* Lightweight temporal trend-data segmentation tests. */
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

const widgetRoot = path.resolve(__dirname, '..')
const { segmentTrendData, validateSegmentDays } = loadTs(path.join(widgetRoot, 'src/runtime/charts/trend-data-segmentation.ts'))
const { calculateLinearTrend } = loadTs(path.join(widgetRoot, 'src/runtime/charts/trendline-calculations.ts'))
const { slopePerDay } = loadTs(path.join(widgetRoot, 'src/runtime/charts/projection-calculations.ts'))
const DAY_MS = 24 * 60 * 60 * 1000
const maximum = Date.UTC(2026, 5, 21)
const offsets = [-130, -100, -70, -40, -20, -10, -5, 0]
const points = offsets.map((offset, sourceIndex) => {
  const timestamp = maximum + offset * DAY_MS
  const sourceX = new Date(timestamp).toISOString().slice(0, 10)
  return { label: sourceX, sourceX, value: offset, sourceIndex }
})

assert.equal(segmentTrendData(points, 'all').totalSelected, 8) // K
assert.equal(segmentTrendData(points, 7).totalSelected, 2) // L
assert.equal(segmentTrendData(points, 30).totalSelected, 4) // M
assert.equal(segmentTrendData(points, 60).totalSelected, 5) // N
assert.equal(segmentTrendData(points, 90).totalSelected, 6) // O
assert.equal(segmentTrendData(points, 120).totalSelected, 7) // P
assert.equal(segmentTrendData(points, 'custom', 15).totalSelected, 3) // Q
assert.equal(validateSegmentDays(0), false) // R
assert.equal(validateSegmentDays(-1), false) // S
assert.equal(validateSegmentDays(1.5), false) // T
assert.equal(validateSegmentDays(3651), false) // U
assert.equal(segmentTrendData(points, 7).effectiveEnd.toISOString().slice(0, 10), '2026-06-21') // V

const categorical = [
  { label: 'A', sourceX: 'A', value: 1, sourceIndex: 0 },
  { label: 'B', sourceX: 'B', value: 2, sourceIndex: 1 }
]
const unavailable = segmentTrendData(categorical, 7)
assert.equal(unavailable.temporal, false)
assert.equal(unavailable.totalSelected, 0) // W
const snapshot = JSON.stringify(points)
segmentTrendData(points, 60)
assert.equal(JSON.stringify(points), snapshot) // X
const sparse = [points[0], points[points.length - 1]]
assert.equal(segmentTrendData(sparse, 7).totalSelected, 1) // Y

const selected = segmentTrendData(points, 30).points
const selectedTrend = calculateLinearTrend(selected)
assert.equal(selected.length, 4)
assert.ok(Math.abs(slopePerDay(selectedTrend) - 1) < 1e-8) // Z

console.log('Trend data segmentation: K-Z passed')
