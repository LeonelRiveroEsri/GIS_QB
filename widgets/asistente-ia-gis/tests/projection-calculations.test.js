/* Lightweight local linear projection tests. */
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
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText
  const localRequire = request => request.startsWith('.')
    ? loadTs(path.resolve(path.dirname(resolved), `${request}.ts`))
    : require(request)
  Function('require', 'module', 'exports', output)(localRequire, moduleInstance, moduleInstance.exports)
  return moduleInstance.exports
}

const widgetRoot = path.resolve(__dirname, '..')
const { calculateLinearTrend } = loadTs(path.join(widgetRoot, 'src/runtime/charts/trendline-calculations.ts'))
const { calculateLinearProjection, formatProjectionDate, slopePerDay, validateProjectionDays } = loadTs(path.join(widgetRoot, 'src/runtime/charts/projection-calculations.ts'))
const closeTo = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`)
const temporalPoints = (labels) => labels.map((label, index) => ({ label, sourceX: label, value: 10 + index * 2 }))
const ddmmyyyy = temporalPoints(['01/06/2026', '02/06/2026'])
const ddmmyyyyModel = calculateLinearTrend(ddmmyyyy)

for (const days of [7, 30, 60, 90, 120]) {
  const projection = calculateLinearProjection(ddmmyyyy, ddmmyyyyModel, days)
  assert.equal(projection.days, days)
  closeTo(projection.estimatedValue, 12 + days * 2)
} // A-E, N

assert.equal(validateProjectionDays(45), true) // F
assert.equal(calculateLinearProjection(ddmmyyyy, ddmmyyyyModel, 45).days, 45)
assert.equal(validateProjectionDays(0), false) // G
assert.equal(validateProjectionDays(-1), false) // H
assert.equal(validateProjectionDays(1.5), false) // I
assert.equal(validateProjectionDays(3651), false) // J

const iso = temporalPoints(['2026-06-01', '2026-06-02'])
assert.ok(calculateLinearProjection(iso, calculateLinearTrend(iso), 7)) // K
assert.ok(calculateLinearProjection(ddmmyyyy, ddmmyyyyModel, 7)) // L
const thirtyDays = calculateLinearProjection(ddmmyyyy, ddmmyyyyModel, 30)
assert.equal(thirtyDays.endDate.toISOString().slice(0, 10), '2026-07-02') // M
assert.equal(thirtyDays.points[0].xValue, Date.UTC(2026, 5, 2))
assert.equal(thirtyDays.points[1].xValue, Date.UTC(2026, 6, 2))
assert.equal(formatProjectionDate(thirtyDays.endDate), '02/07/2026')
closeTo(thirtyDays.estimatedValue, 72) // N

const categorical = [
  { label: 'A', sourceX: 'A', value: 1 },
  { label: 'B', sourceX: 'B', value: 2 }
]
assert.equal(calculateLinearProjection(categorical, calculateLinearTrend(categorical), 7), null) // O
const snapshot = JSON.stringify(ddmmyyyy)
calculateLinearProjection(ddmmyyyy, ddmmyyyyModel, 30)
assert.equal(JSON.stringify(ddmmyyyy), snapshot) // P
assert.equal(validateProjectionDays(Number.NaN), false)
assert.equal(validateProjectionDays(Number.POSITIVE_INFINITY), false)
assert.equal(calculateLinearProjection(ddmmyyyy, { ...ddmmyyyyModel, slope: Number.NaN }, 7), null) // Q
const single = [{ label: '01/06/2026', sourceX: '01/06/2026', value: 10 }]
assert.equal(calculateLinearProjection(single, calculateLinearTrend(single), 7), null) // R
closeTo(slopePerDay(ddmmyyyyModel), 2)

console.log('Linear projection calculations: A-R passed')
