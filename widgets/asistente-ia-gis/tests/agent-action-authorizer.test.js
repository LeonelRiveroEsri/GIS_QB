/* Lightweight action authorization tests. Run with Node from C:\EXP\client. */
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
const { authorizeAgentAction } = loadTs(path.join(widgetRoot, 'src/runtime/actions/agent-action-authorizer.ts'))
const { handleAuthorizedAgentAction } = loadTs(path.join(widgetRoot, 'src/runtime/actions/authorized-agent-action-handler.ts'))
const featureLayer = { id: 'layer-1', type: 'feature' }
const groupLayer = { id: 'group-1', type: 'group', isGroupLayer: true }
const basemapLayer = {
  id: 'basemap-1',
  type: 'tile',
  isBasemapLayer: true,
  url: 'https://example.test/tiles?token=secret',
  portalItemId: 'sensitive-portal-item'
}
const connected = { mapConnected: true, viewAvailable: true, availableLayers: [featureLayer, groupLayer, basemapLayer, { id: 'Layer-A', type: 'scene' }] }
const zoomExtent = { id: 'extent', title: 'Zoom', type: 'zoom_to_extent', extent: { xmin: 1, ymin: 2, xmax: 3, ymax: 4 } }
const zoomLayer = (layerId) => ({ id: 'layer', title: 'Zoom capa', type: 'zoom_to_layer', layerId })
const visibility = (layerId) => ({ id: 'visibility', title: 'Visibilidad', type: 'set_layer_visibility', layerId, visible: true })
const approvedLoad = { id: 'load', title: 'Cargar TMF', type: 'load_portal_item_layer', portalItemId: '096c67f44e6d499ab1f016fde6893592', layerId: 'asistente-imagen-tmf' }

assert.equal(authorizeAgentAction(zoomExtent, connected).code, 'ACTION_AUTHORIZED') // A
assert.equal(authorizeAgentAction(zoomExtent, { ...connected, mapConnected: false }).code, 'MAP_NOT_CONNECTED') // B
assert.equal(authorizeAgentAction(zoomExtent, { ...connected, viewAvailable: false }).code, 'MAP_VIEW_UNAVAILABLE') // C
assert.equal(authorizeAgentAction(zoomLayer('layer-1'), connected).authorized, true) // D
assert.equal(authorizeAgentAction(zoomLayer('missing'), connected).code, 'LAYER_NOT_ALLOWED') // E
assert.equal(authorizeAgentAction(zoomLayer('Layer title'), connected).code, 'LAYER_NOT_ALLOWED') // F
assert.equal(authorizeAgentAction(visibility('layer-1'), connected).authorized, true) // G
assert.equal(authorizeAgentAction(visibility('missing'), connected).code, 'LAYER_NOT_ALLOWED') // H
assert.equal(authorizeAgentAction({ id: 'open', title: 'Abrir', type: 'open_url', url: 'https://example.test' }, connected).code, 'ACTION_NOT_ENABLED') // I
assert.equal(authorizeAgentAction({ id: 'unknown', title: 'Unknown', type: 'unknown' }, connected).code, 'ACTION_NOT_SUPPORTED') // J
assert.equal(authorizeAgentAction(zoomLayer('layer-10'), connected).code, 'LAYER_NOT_ALLOWED') // K
assert.equal(authorizeAgentAction(zoomLayer('layer-a'), connected).code, 'LAYER_NOT_ALLOWED') // L
assert.equal(authorizeAgentAction(zoomLayer('group-1'), connected).code, 'LAYER_NOT_ALLOWED_BY_POLICY') // N
const basemapRejection = authorizeAgentAction(zoomLayer('basemap-1'), connected)
assert.equal(basemapRejection.code, 'LAYER_NOT_ALLOWED_BY_POLICY') // O, A
assert.equal(basemapRejection.message, 'La capa solicitada no está habilitada para acciones del asistente.') // B
const serializedRejection = JSON.stringify(basemapRejection)
assert.equal(serializedRejection.includes('basemap-1'), false) // C
assert.equal(serializedRejection.includes('tile'), false) // D
assert.equal(serializedRejection.includes('BASEMAP_LAYER_NOT_ALLOWED'), false) // E
assert.equal(serializedRejection.includes('diagnostic'), false) // F
assert.equal(authorizeAgentAction(visibility('group-1'), connected).code, 'LAYER_NOT_ALLOWED_BY_POLICY') // Q
assert.equal(authorizeAgentAction(visibility('basemap-1'), connected).code, 'LAYER_NOT_ALLOWED_BY_POLICY') // R

let goToCalls = 0
let visible = false
let openCalls = 0
const passiveContext = {
  ...connected,
  goTo: () => { goToCalls++ },
  layer: { get visible () { return visible }, set visible (value) { visible = value } },
  open: () => { openCalls++ }
}
authorizeAgentAction(zoomExtent, passiveContext)
authorizeAgentAction(visibility('layer-1'), passiveContext)
authorizeAgentAction({ id: 'open', title: 'Abrir', type: 'open_url', url: 'https://example.test' }, passiveContext)
assert.equal(goToCalls, 0) // M
assert.equal(visible, false) // N
assert.equal(openCalls, 0) // O

const localContext = { mapConnected: true, viewAvailable: true, availableLayers: [{ id: 'current-layer', type: 'feature' }] }
assert.equal(authorizeAgentAction(zoomLayer('current-layer'), localContext).authorized, true) // P
assert.equal(authorizeAgentAction(zoomLayer('external-layer'), localContext).authorized, false) // Q

let executorCalls = 0
const executor = async action => {
  executorCalls++
  return { success: true, actionType: action.type, code: 'ACTION_EXECUTED', message: 'Ejecutada.' }
}
const receivedResponse = { actions: [zoomExtent] }
assert.equal(receivedResponse.actions.length, 1)
assert.equal(executorCalls, 0) // R

;(async () => {
  assert.equal(authorizeAgentAction(zoomLayer('missing'), connected).code, 'LAYER_NOT_ALLOWED') // S

  const rejected = await handleAuthorizedAgentAction(zoomLayer('group-1'), connected, {}, executor)
  assert.equal(rejected.code, 'LAYER_NOT_ALLOWED_BY_POLICY')
  assert.equal(executorCalls, 0) // T, H

  const acceptedLayer = await handleAuthorizedAgentAction(zoomLayer('layer-1'), connected, {}, executor)
  assert.equal(acceptedLayer.code, 'ACTION_EXECUTED')
  assert.equal(executorCalls, 1) // U

  const accepted = await handleAuthorizedAgentAction(zoomExtent, connected, {}, executor)
  assert.equal(accepted.code, 'ACTION_EXECUTED')
  assert.equal(executorCalls, 2) // V

  const blockedUrl = await handleAuthorizedAgentAction({ id: 'open', title: 'Abrir', type: 'open_url', url: 'https://example.test' }, connected, {}, executor)
  assert.equal(blockedUrl.code, 'ACTION_NOT_ENABLED')
  assert.equal(executorCalls, 2) // W

  assert.equal(authorizeAgentAction(approvedLoad, connected).authorized, true)
  assert.equal(authorizeAgentAction({ ...approvedLoad, portalItemId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, connected).code, 'LAYER_NOT_ALLOWED')
  assert.equal(authorizeAgentAction({ id: 'opacity', title: 'Opacidad', type: 'set_layer_opacity', layerId: 'external-layer', opacity: 0.5 }, connected).code, 'LAYER_NOT_ALLOWED')

  console.log('Agent action authorizer and layer policy integration: A-Z passed')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
