/* Donut calculation and architecture safeguards. */
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
const { calculateDonut } = loadTs(path.join(root, 'donut-calculations.ts'))
const renderer = fs.readFileSync(path.join(root, 'chart-renderer.tsx'), 'utf8')
const controls = fs.readFileSync(path.join(root, 'donut-controls.tsx'), 'utf8')
const presentationControls = fs.readFileSync(path.join(root, 'chart-presentation-controls.tsx'), 'utf8')
const fieldAnalysis = fs.readFileSync(path.join(root, 'chart-field-analysis.ts'), 'utf8')

const rows = [
  { paddock: 'P01', cota: 10 },
  { paddock: 'P01', cota: 20 },
  { paddock: 'P02', cota: 5 },
  { paddock: '', cota: 100 },
  { paddock: null, cota: 100 }
]
const counted = calculateDonut(rows, 'paddock', 'count')
assert.deepEqual(counted.segments.map(segment => [segment.label, segment.value]), [['P01', 2], ['P02', 1]]) // N, O, U
const summed = calculateDonut(rows, 'paddock', 'cota')
assert.deepEqual(summed.segments.map(segment => [segment.label, segment.value]), [['P01', 30], ['P02', 5]]) // P
assert.ok(Math.abs(summed.segments.reduce((sum, segment) => sum + segment.percentage, 0) - 100) < 1e-9) // Q

const many = calculateDonut(Array.from({ length: 10 }, (_, index) => ({ category: `C${index + 1}`, value: index + 1 })), 'category', 'value')
assert.equal(many.segments.length, 8)
assert.equal(many.segments[7].label, 'Otros') // R
assert.equal(many.segments[7].value, 6) // S: 1 + 2 + 3
assert.deepEqual(calculateDonut([{ category: 'A', value: 0 }], 'category', 'value'), { segments: [], total: 0 }) // T
assert.match(controls, />Conteo<\/button>/)
assert.match(fieldAnalysis, /field\.kind === 'categorical' \|\| field\.kind === 'temporal'/)
const donutBranch = renderer.slice(renderer.indexOf("artifact.chartType === 'donut'"), renderer.indexOf('return <section', renderer.indexOf("artifact.chartType === 'donut'") + 1))
assert.doesNotMatch(donutBranch, /TrendlineControls|ProjectionControls/) // V, W
assert.match(presentationControls, /const supportsTrends = artifact\.chartType === 'line' \|\| artifact\.chartType === 'area' \|\| artifact\.chartType === 'scatter'/)

console.log('Donut chart safeguards: N-W passed')