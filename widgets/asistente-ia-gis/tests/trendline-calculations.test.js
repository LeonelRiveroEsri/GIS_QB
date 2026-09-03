/* Lightweight local trendline calculation tests. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const loadTs = (relativePath) => {
  const source = fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText
  const moduleInstance = { exports: {} }
  Function('require', 'module', 'exports', output)(require, moduleInstance, moduleInstance.exports)
  return moduleInstance.exports
}

const {
  calculateLinearTrend,
  calculateMovingAverage,
  calculatePolynomialTrend,
  resolveTrendXValues
} = loadTs('src/runtime/charts/trendline-calculations.ts')
const { MAX_CHART_POINTS } = loadTs('src/validation/validation-limits.ts')
const points = values => values.map((value, index) => ({ label: String(index), sourceX: index, value }))
const closeTo = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`)

const linear = calculateLinearTrend(points([1, 3, 5, 7]))
closeTo(linear.slope, 2) // A
closeTo(linear.intercept, 1)
closeTo(linear.rSquared, 1) // B

const constant = calculateLinearTrend(points([4, 4, 4]))
closeTo(constant.slope, 0) // C
closeTo(constant.rSquared, 1)
assert.equal(calculateLinearTrend(points([1])), null) // D

assert.deepEqual(calculateMovingAverage(points([1, 2, 3, 4, 5]), 3).points, [
  { index: 2, value: 2 },
  { index: 3, value: 3 },
  { index: 4, value: 4 }
]) // E
assert.deepEqual(calculateMovingAverage(points([1, 2, 3, 4, 5]), 5).points, [{ index: 4, value: 3 }]) // F
assert.equal(calculateMovingAverage(points([1, 2, 3]), 5), null) // G
const movingSource = points([2, 4, 6, 8])
const movingSnapshot = JSON.stringify(movingSource)
calculateMovingAverage(movingSource, 3)
assert.equal(JSON.stringify(movingSource), movingSnapshot) // H

const quadratic = calculatePolynomialTrend(points([1, 4, 9, 16]), 2)
quadratic.points.forEach((point, index) => closeTo(point.value, (index + 1) ** 2)) // I
closeTo(quadratic.rSquared, 1)
const cubic = calculatePolynomialTrend(points([0, 1, 8, 27, 64]), 3)
cubic.points.forEach((point, index) => closeTo(point.value, index ** 3)) // J
assert.equal(calculatePolynomialTrend(points([1, 4]), 2), null) // K
assert.equal(calculatePolynomialTrend([
  { label: 'A', sourceX: 1, value: 1 },
  { label: 'B', sourceX: 1, value: 2 },
  { label: 'C', sourceX: 1, value: 3 }
], 2), null) // L

assert.equal(calculateLinearTrend([{ label: 'A', sourceX: 0, value: Number.NaN }, { label: 'B', sourceX: 1, value: 2 }]), null)
assert.equal(calculateMovingAverage([{ label: 'A', sourceX: 0, value: Number.POSITIVE_INFINITY }], 1), null) // M
assert.equal(MAX_CHART_POINTS, 200) // N

assert.deepEqual(resolveTrendXValues([
  { label: '01/06/2026', sourceX: '01/06/2026', value: 1 },
  { label: '08/06/2026', sourceX: '08/06/2026', value: 2 }
]), [Date.UTC(2026, 5, 1), Date.UTC(2026, 5, 8)])
assert.deepEqual(resolveTrendXValues([
  { label: 'A', sourceX: 'A', value: 1 },
  { label: 'B', sourceX: 'B', value: 2 }
]), [0, 1])

console.log('Trendline calculations: A-N passed')
