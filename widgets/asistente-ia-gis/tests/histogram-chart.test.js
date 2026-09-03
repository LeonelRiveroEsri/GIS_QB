/* Histogram calculation and architecture safeguards. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const loadTs = (file) => {
  const source = fs.readFileSync(file, 'utf8')
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const moduleInstance = { exports: {} }
  Function('require', 'module', 'exports', output)(require, moduleInstance, moduleInstance.exports)
  return moduleInstance.exports
}

const root = path.resolve(__dirname, '../src/runtime/charts')
const { calculateHistogram, extractFiniteValues } = loadTs(path.join(root, 'histogram-calculations.ts'))
const renderer = fs.readFileSync(path.join(root, 'chart-renderer.tsx'), 'utf8')
const presentationControls = fs.readFileSync(path.join(root, 'chart-presentation-controls.tsx'), 'utf8')
const controls = fs.readFileSync(path.join(root, 'histogram-controls.tsx'), 'utf8')

const rows = [{ cota: 1 }, { cota: 2 }, { cota: '3' }, { cota: 4 }, { cota: Number.NaN }, { cota: 8 }]
const values = extractFiniteValues(rows, 'cota')
assert.deepEqual(values, [1, 2, 4, 8]) // B, C
const automatic = calculateHistogram(values, 'auto')
assert.ok(automatic.bins.length >= 3 && automatic.bins.length <= 20) // D
assert.equal(calculateHistogram(values, 5).bins.length, 5) // E
assert.equal(calculateHistogram(values, 10).bins.length, 10) // F
const equalValues = calculateHistogram([7, 7, 7], 'auto')
assert.equal(equalValues.bins.length, 1)
assert.equal(equalValues.bins[0].count, 3) // G
assert.deepEqual(calculateHistogram([], 'auto'), { bins: [], total: 0 }) // H
assert.equal(automatic.bins.reduce((sum, bin) => sum + bin.count, 0), values.length) // I
assert.match(controls, /\['auto', 5, 10, 15, 20\]/)
const histogramBranch = renderer.slice(renderer.indexOf("artifact.chartType === 'histogram'"), renderer.indexOf("artifact.chartType === 'donut'"))
assert.doesNotMatch(histogramBranch, /TrendlineControls|ProjectionControls/) // J, K
assert.match(presentationControls, /const supportsTrends = artifact\.chartType === 'line' \|\| artifact\.chartType === 'area' \|\| artifact\.chartType === 'scatter'/)

console.log('Histogram chart safeguards: B-K passed')