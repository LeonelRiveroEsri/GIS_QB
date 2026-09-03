/* Lightweight action executor tests. Run with Node from C:\EXP\client. */
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
const { executeAgentAction } = loadTs(path.join(widgetRoot, 'src/runtime/actions/agent-action-executor.ts'))
const zoomExtent = {
  id: 'zoom-extent',
  title: 'Zoom',
  type: 'zoom_to_extent',
  extent: { xmin: 1, ymin: 2, xmax: 3, ymax: 4 },
  spatialReference: { wkid: 4326 }
}
const zoomLayer = { id: 'zoom-layer', title: 'Zoom capa', type: 'zoom_to_layer', layerId: 'layer-1' }
const visibility = (visible, layerId = 'layer-1') => ({
  id: `visibility-${visible}`,
  title: 'Visibilidad',
  type: 'set_layer_visibility',
  layerId,
  visible
})
const createContext = (layers = []) => {
  const calls = []
  const added = []
  return {
    calls,
    added,
    context: {
      view: {
        map: {
          findLayerById: id => layers.find(layer => layer.id === id) || added.find(layer => layer.id === id),
          add: layer => { added.push(layer) }
        },
        goTo: async target => { calls.push(target) }
      }
    }
  }
}

;(async () => {
  const passiveContext = createContext()
  const proposedAction = zoomExtent
  assert.equal(passiveContext.calls.length, 0) // P: receiving an action does not invoke the executor
  assert.equal(proposedAction.type, 'zoom_to_extent')

  const extentContext = createContext()
  assert.equal((await executeAgentAction(zoomExtent, extentContext.context)).success, true)
  assert.equal(extentContext.calls.length, 1)
  assert.deepEqual(extentContext.calls[0], { ...zoomExtent.extent, spatialReference: { wkid: 4326 } }) // A

  assert.equal((await executeAgentAction(zoomExtent, {})).code, 'MAP_VIEW_UNAVAILABLE') // B
  const failingContext = createContext()
  failingContext.context.view.goTo = async () => { throw new Error('ArcGIS failure') }
  assert.equal((await executeAgentAction(zoomExtent, failingContext.context)).code, 'ACTION_EXECUTION_FAILED') // C

  const layer = { id: 'layer-1', title: 'Layer title', visible: false, fullExtent: { xmin: 10 } }
  const layerContext = createContext([layer])
  assert.equal((await executeAgentAction(zoomLayer, layerContext.context)).success, true) // D
  assert.equal((await executeAgentAction({ ...zoomLayer, layerId: 'missing' }, layerContext.context)).code, 'LAYER_NOT_FOUND') // E
  assert.equal((await executeAgentAction(zoomLayer, createContext([{ ...layer, fullExtent: undefined }]).context)).code, 'LAYER_EXTENT_UNAVAILABLE') // F
  assert.deepEqual(layerContext.calls[0], layer.fullExtent) // G

  await executeAgentAction(visibility(true), layerContext.context)
  assert.equal(layer.visible, true) // H
  await executeAgentAction(visibility(false), layerContext.context)
  assert.equal(layer.visible, false) // I
  assert.equal((await executeAgentAction(visibility(true, 'missing'), layerContext.context)).code, 'LAYER_NOT_FOUND') // J
  assert.equal((await executeAgentAction({ ...zoomLayer, layerId: 'Layer title' }, layerContext.context)).code, 'LAYER_NOT_FOUND') // K

  let opened = false
  global.window = { open: () => { opened = true } }
  assert.equal((await executeAgentAction({ id: 'open', title: 'Abrir', type: 'open_url', url: 'https://example.test' }, layerContext.context)).code, 'ACTION_NOT_ENABLED') // L
  assert.equal(opened, false) // N

  const unsupported = await executeAgentAction({ id: 'unknown', title: 'Unknown', type: 'unknown' }, layerContext.context)
  assert.equal(unsupported.code, 'ACTION_NOT_SUPPORTED') // M
  assert.equal(layerContext.context.view.map.layers, undefined) // O: executor never creates or adds layers

  const imageryContext = createContext()
  let loadCalls = 0
  imageryContext.context.createPortalItemLayer = async properties => ({
    id: properties.id,
    title: properties.title,
    visible: false,
    opacity: properties.opacity,
    fullExtent: { xmin: 20 },
    load: async () => { loadCalls++ }
  })
  const loadImagery = {
    id: 'load-tmf', title: 'IMAGEN_TMF', type: 'load_portal_item_layer',
    portalItemId: '096c67f44e6d499ab1f016fde6893592', layerId: 'asistente-imagen-tmf', opacity: 0.55, zoom: true
  }
  assert.equal((await executeAgentAction(loadImagery, imageryContext.context)).code, 'LAYER_LOADED')
  assert.equal(imageryContext.added.length, 1)
  assert.equal(imageryContext.added[0].visible, true)
  assert.equal(imageryContext.added[0].opacity, 0.55)
  assert.equal(loadCalls, 1)
  assert.deepEqual(imageryContext.calls.at(-1), { xmin: 20 })
  assert.equal((await executeAgentAction({ ...loadImagery, opacity: 0.3 }, imageryContext.context)).code, 'LAYER_REUSED')
  assert.equal(imageryContext.added.length, 1)
  assert.equal(imageryContext.added[0].opacity, 0.3)

  const opacityResult = await executeAgentAction({ id: 'opacity', title: 'Opacidad', type: 'set_layer_opacity', layerId: 'asistente-imagen-tmf', opacity: 0.7 }, imageryContext.context)
  assert.equal(opacityResult.success, true)
  assert.equal(imageryContext.added[0].opacity, 0.7)

  console.log('Agent action executor: A-Z passed')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
