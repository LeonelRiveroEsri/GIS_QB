/* Lightweight chart field analysis tests. */
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
const { analyzeChartFields, resolveInitialChartField } = loadTs(path.join(widgetRoot, 'src/runtime/charts/chart-field-analysis.ts'))
const artifact = {
  id: 'fields', type: 'chart', title: 'Campos', chartType: 'line', xField: 'iso', yField: 'value',
  data: [
    { iso: '2026-06-01', localDate: '01/06/2026', value: 1, category: 'A', object: { a: 1 }, array: [1], mixed: 1 },
    { iso: '2026-06-02', localDate: '02/06/2026', value: 2, category: 'B', object: { a: 2 }, array: [2], mixed: 2 },
    { iso: '2026-06-03', localDate: '03/06/2026', value: 3, category: 'C', object: null, array: null, mixed: 'invalid' }
  ]
}
const analysis = analyzeChartFields(artifact)
const kind = name => analysis.fields.find(field => field.name === name).kind

assert.equal(kind('iso'), 'temporal') // A
assert.equal(kind('localDate'), 'temporal') // B
assert.equal(kind('value'), 'numeric') // C
assert.equal(kind('category'), 'categorical') // D
assert.equal(kind('object'), 'unsupported') // E
assert.equal(kind('array'), 'unsupported') // F
assert.deepEqual(analysis.yCandidates.map(field => field.name).sort(), ['mixed', 'value']) // G, J
assert.equal(resolveInitialChartField(artifact.xField, analysis.xCandidates), 'iso') // H
assert.equal(resolveInitialChartField(artifact.yField, analysis.yCandidates), 'value') // I
assert.equal(analysis.xCandidates.some(field => field.name === 'object' || field.name === 'array'), false)

console.log('Chart field analysis: A-J passed')
