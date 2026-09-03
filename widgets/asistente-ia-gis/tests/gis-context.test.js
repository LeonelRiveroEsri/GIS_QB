/* Lightweight GIS context tests. Run with Node from C:\EXP\client. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const cache = new Map()
const loadTs = (file) => {
  const resolved = path.resolve(file)
  if (cache.has(resolved)) return cache.get(resolved).exports
  const module = { exports: {} }
  cache.set(resolved, module)
  const source = fs.readFileSync(resolved, 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText
  const localRequire = request => request.startsWith('.')
    ? loadTs(path.resolve(path.dirname(resolved), `${request}.ts`))
    : require(request)
  Function('require', 'module', 'exports', output)(localRequire, module, module.exports)
  return module.exports
}

const widgetRoot = path.resolve(__dirname, '..')
const { buildGisContext } = loadTs(path.join(widgetRoot, 'src/utils/gis-context.ts'))
const collection = values => ({ toArray: () => [...values] })
const layer = (id, type, overrides = {}) => ({ id, type, title: id, visible: true, parent: undefined, ...overrides })
const createJimuMapView = ({ operational = [], basemap = [], reference = [], ground = [], allLayers }) => ({
  view: {
    type: '2d',
    map: {
      allLayers: collection(allLayers || [...operational, ...basemap, ...reference, ...ground]),
      basemap: {
        baseLayers: collection(basemap),
        referenceLayers: collection(reference),
        groundLayers: collection([])
      },
      ground: { layers: collection(ground) }
    }
  }
})

const feature = layer('feature-1', 'feature')
const tile = layer('tile-1', 'tile')
const worldImagery = layer('World_Imagery_6611', 'tile', { title: 'Any title' })
const reference = layer('reference-1', 'vector-tile')
const elevation = layer('elevation-1', 'elevation')
const group = layer('group-1', 'group')
const child = layer('child-1', 'feature', { parent: group })
const hiddenChild = layer('hidden-child', 'feature', { visible: false, parent: group })
const hiddenGroup = layer('hidden-group', 'group', { visible: false })
const childOfHiddenGroup = layer('hidden-parent-child', 'feature', { parent: hiddenGroup })
const noId = layer('', 'feature')

const source = createJimuMapView({
  operational: [feature, tile, group, child, hiddenChild, hiddenGroup, childOfHiddenGroup, noId],
  basemap: [worldImagery],
  reference: [reference],
  ground: [elevation]
})
const before = source.view.map.allLayers.toArray().map(item => ({ ...item }))
const context = buildGisContext(source, 20)
const ids = context.visibleLayers.map(item => item.id)

assert.equal(ids.includes('feature-1'), true) // A
assert.equal(ids.includes('tile-1'), true) // B
assert.equal(ids.includes('World_Imagery_6611'), false) // C, L
assert.equal(ids.includes('reference-1'), false) // D
assert.equal(ids.includes('group-1'), false) // E
assert.equal(ids.includes('child-1'), true) // F
assert.equal(ids.includes('hidden-child'), false) // G
assert.equal(ids.includes('hidden-parent-child'), false) // H
assert.equal(ids.includes('elevation-1'), false) // I
assert.equal(context.layerCount, 5) // J: feature, tile and three operational group children
assert.equal(context.visibleLayerCount, 3) // K: feature, tile and visible group child
assert.deepEqual(source.view.map.allLayers.toArray().map(item => ({ ...item })), before) // P

worldImagery.title = 'Operational-looking title'
worldImagery.url = 'https://operational-looking.example.test'
worldImagery.portalItem = { id: 'operational-looking-item' }
const reclassified = buildGisContext(source, 20)
assert.equal(reclassified.visibleLayers.some(item => item.id === worldImagery.id), false) // M, N, O
assert.equal(context.visibleLayers.some(item => item.id === 'layer-sin-id'), false)

console.log('GIS context operational layers: A-P passed')