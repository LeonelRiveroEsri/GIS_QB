/* Lightweight chart point normalization tests. */
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
  const localRequire = request => request.startsWith('.') ? loadTs(path.resolve(path.dirname(resolved), `${request}.ts`)) : require(request)
  Function('require', 'module', 'exports', output)(localRequire, moduleInstance, moduleInstance.exports)
  return moduleInstance.exports
}
const { normalizeChartPoints } = loadTs(path.resolve(__dirname, '../src/runtime/charts/chart-points.ts'))

const points = normalizeChartPoints({
  id: 'chart-1',
  type: 'chart',
  title: 'Valores',
  chartType: 'line',
  xField: 'category',
  yField: 'value',
  data: [
    { category: 'A', value: 1 },
    { category: 2, value: 3.5 },
    { category: '<b>C</b>', value: 4 },
    { category: 'Invalid', value: Number.NaN },
    { category: null, value: 5 },
    { other: 'Missing fields' }
  ]
})

assert.deepEqual(points, [
  { label: 'A', sourceX: 'A', value: 1, sourceIndex: 0 },
  { label: '2', sourceX: 2, value: 3.5, sourceIndex: 1 },
  { label: '<b>C</b>', sourceX: '<b>C</b>', value: 4, sourceIndex: 2 }
])

const pointsWithInvalidMiddleRow = normalizeChartPoints({
  id: 'chart-2',
  type: 'chart',
  title: 'Valores con fila inválida',
  chartType: 'line',
  xField: 'category',
  yField: 'value',
  data: [
    { category: 'A', value: 1 },
    { category: 'Invalid', value: Number.NaN },
    { category: 'C', value: 3 }
  ]
})

assert.deepEqual(pointsWithInvalidMiddleRow, [
  { label: 'A', sourceX: 'A', value: 1, sourceIndex: 0 },
  { label: 'C', sourceX: 'C', value: 3, sourceIndex: 1 }
])