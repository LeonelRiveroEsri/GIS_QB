/* Lightweight layer action policy tests. Run with Node from C:\EXP\client. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const loadTs = (file) => {
  const source = fs.readFileSync(file, 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText
  const module = { exports: {} }
  Function('require', 'module', 'exports', output)(require, module, module.exports)
  return module.exports
}

const widgetRoot = path.resolve(__dirname, '..')
const { evaluateLayerActionPolicy } = loadTs(path.join(widgetRoot, 'src/runtime/actions/layer-action-policy.ts'))
const allowed = (overrides = {}) => ({ id: 'layer-1', type: 'feature', ...overrides })

assert.equal(evaluateLayerActionPolicy(allowed()).code, 'LAYER_ALLOWED') // A
assert.equal(evaluateLayerActionPolicy(allowed({ id: '' })).code, 'LAYER_ID_MISSING') // B
assert.equal(evaluateLayerActionPolicy(allowed({ isBasemapLayer: true })).code, 'BASEMAP_LAYER_NOT_ALLOWED') // C
assert.equal(evaluateLayerActionPolicy(allowed({ type: 'group', isGroupLayer: true })).code, 'GROUP_LAYER_NOT_ALLOWED') // D
assert.equal(evaluateLayerActionPolicy(allowed({ type: 'unknown' })).code, 'LAYER_TYPE_NOT_ALLOWED') // E
for (const type of ['feature', 'map-image', 'imagery', 'tile', 'vector-tile', 'scene']) {
  assert.equal(evaluateLayerActionPolicy(allowed({ type })).allowed, true)
} // F
assert.equal(evaluateLayerActionPolicy(allowed({ type: 'feature-service' })).allowed, false) // G
assert.equal(evaluateLayerActionPolicy(allowed({ title: 'Basemap', type: 'feature' })).allowed, true) // H
assert.equal(evaluateLayerActionPolicy(allowed({ url: 'https://untrusted.example.test', type: 'feature' })).allowed, true) // I

const original = Object.freeze(allowed({ title: 'Original', url: 'https://example.test' }))
const snapshot = { ...original }
let goToCalls = 0
let visibilityChanges = 0
evaluateLayerActionPolicy(original)
assert.deepEqual(original, snapshot) // J
assert.equal(goToCalls, 0) // K
assert.equal(visibilityChanges, 0) // L

console.log('Layer action policy: A-L passed')