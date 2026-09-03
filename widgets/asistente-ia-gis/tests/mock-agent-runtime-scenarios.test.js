/* Lightweight mock runtime scenario tests. Run with Node from C:\EXP\client. */
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
const { MockAgentClient } = loadTs(path.join(widgetRoot, 'src/services/mock-agent-client.ts'))
const { validateAgentResponse } = loadTs(path.join(widgetRoot, 'src/validation/agent-response-validator.ts'))
const { buildGisContext } = loadTs(path.join(widgetRoot, 'src/utils/gis-context.ts'))
const gisContext = (visibleLayers) => ({
  schemaVersion: '1.0',
  mapConnected: true,
  mapTitle: 'Mock map',
  mapType: '2d',
  visibleLayers,
  layerCount: visibleLayers.length,
  visibleLayerCount: visibleLayers.length,
  maxContextLayers: 20,
  extent: { xmin: 1, ymin: 2, xmax: 3, ymax: 4 }
})
const request = (message, context) => ({ schemaVersion: '1.0', requestId: `request-${message}`, message, gisContext: context })
const send = (message, context) => new MockAgentClient(0).send(request(message, context))

;(async () => {
  const eligible = gisContext([{ id: 'real-feature', title: 'Feature', type: 'feature' }])
  const zoom = await send('[mock:zoom]', eligible)
  assert.equal(zoom.actions[0].type, 'zoom_to_extent') // A

  const zoomLayer = await send('[mock:zoom-layer]', eligible)
  assert.equal(zoomLayer.actions[0].type, 'zoom_to_layer') // B
  assert.equal(zoomLayer.actions[0].layerId, 'real-feature') // C

  const withoutContext = await send('[mock:zoom-layer]')
  assert.equal(withoutContext.actions, undefined) // D
  const ineligible = gisContext([
    { id: 'group-1', title: 'Group', type: 'group' },
    { id: 'unknown-1', title: 'Unknown', type: 'unknown' }
  ])
  const withoutCandidate = await send('[mock:zoom-layer]', ineligible)
  assert.equal(withoutCandidate.actions, undefined) // E
  assert.equal(withoutCandidate.message.includes('No existe una capa visible elegible'), true)

  const mixed = gisContext([
    { id: 'group-1', title: 'Group', type: 'group' },
    { id: 'unknown-1', title: 'Unknown', type: 'unknown' },
    { id: 'first-real', title: 'First', type: 'feature' },
    { id: 'second-real', title: 'Second', type: 'scene' }
  ])
  assert.equal((await send('[mock:zoom-layer]', mixed)).actions[0].layerId, 'first-real') // F, G, H

  const visibility = await send('[mock:visibility]', eligible)
  assert.equal(visibility.actions[0].layerId, 'real-feature') // I
  assert.equal(visibility.actions[0].visible, false)
  assert.equal((await send('[mock:visibility]')).actions, undefined) // J

  let goToCalls = 0
  let visibilityChanges = 0
  let openCalls = 0
  const observedLayer = {
    id: 'observed-layer',
    title: 'Observed',
    type: 'feature',
    set visible (value) { visibilityChanges++ }
  }
  const observedContext = gisContext([observedLayer])
  observedContext.goTo = () => { goToCalls++ }
  global.window = { open: () => { openCalls++ } }
  await send('[mock:combined]', observedContext)
  assert.equal(goToCalls, 0) // K
  assert.equal(visibilityChanges, 0) // L
  assert.equal(openCalls, 0) // M

  assert.equal(validateAgentResponse(zoomLayer).success, true) // N
  const before = JSON.stringify(mixed)
  await send('[mock:zoom-layer]', mixed)
  assert.equal(JSON.stringify(mixed), before) // O

  const neutral = await send('[mock:unknown]', eligible)
  assert.equal(neutral.actions, undefined) // P

  const combinedWithoutCandidate = await send('[mock:combined]', ineligible)
  assert.deepEqual(combinedWithoutCandidate.actions.map(action => action.type), ['zoom_to_extent'])

  const operational = { id: 'operational-1', title: 'Operational', type: 'feature', visible: true }
  const basemap = { id: 'World_Imagery_6611', title: 'World imagery', type: 'tile', visible: true }
  const reference = { id: 'reference-1', title: 'Reference', type: 'vector-tile', visible: true }
  const collection = values => ({ toArray: () => [...values] })
  const correctedContext = buildGisContext({
    view: {
      type: '2d',
      map: {
        allLayers: collection([basemap, operational, reference]),
        basemap: { baseLayers: collection([basemap]), referenceLayers: collection([reference]), groundLayers: collection([]) },
        ground: { layers: collection([]) }
      }
    }
  }, 20)
  const correctedZoom = await send('[mock:zoom-layer]', correctedContext)
  assert.equal(correctedZoom.actions[0].layerId, 'operational-1') // Q
  assert.notEqual(correctedZoom.actions[0].layerId, 'World_Imagery_6611') // R
  assert.notEqual(correctedZoom.actions[0].layerId, 'reference-1') // S
  const noOperationalContext = buildGisContext({
    view: {
      type: '2d',
      map: {
        allLayers: collection([basemap, reference]),
        basemap: { baseLayers: collection([basemap]), referenceLayers: collection([reference]), groundLayers: collection([]) },
        ground: { layers: collection([]) }
      }
    }
  }, 20)
  assert.equal((await send('[mock:zoom-layer]', noOperationalContext)).actions, undefined) // T
  assert.equal((await send('[mock:visibility]', correctedContext)).actions[0].layerId, 'operational-1') // U

  const lineChart = await send('[mock:chart]', eligible)
  assert.equal(lineChart.artifacts[0].type, 'chart') // V
  assert.equal(lineChart.artifacts[0].chartType, 'line') // W
  assert.equal(validateAgentResponse(lineChart).success, true) // X
  const barChart = await send('[mock:bar-chart]', eligible)
  assert.equal(barChart.artifacts[0].chartType, 'bar') // Y
  assert.equal(validateAgentResponse(barChart).success, true) // Z
  const scatterChart = await send('[mock:scatter-chart]', eligible)
  assert.equal(scatterChart.artifacts[0].chartType, 'scatter')
  assert.equal(scatterChart.artifacts[0].xField, 'superficie')
  assert.equal(validateAgentResponse(scatterChart).success, true)
  const areaChart = await send('[mock:area-chart]', eligible)
  assert.equal(areaChart.artifacts[0].chartType, 'area')
  assert.equal(areaChart.artifacts[0].xField, 'fecha')
  assert.equal(validateAgentResponse(areaChart).success, true)
  const histogramChart = await send('[mock:histogram-chart]', eligible)
  assert.equal(histogramChart.artifacts[0].chartType, 'histogram')
  assert.equal(histogramChart.artifacts[0].yField, 'cota')
  assert.equal(validateAgentResponse(histogramChart).success, true)
  const donutChart = await send('[mock:donut-chart]', eligible)
  assert.equal(donutChart.artifacts[0].chartType, 'donut')
  assert.equal(donutChart.artifacts[0].xField, 'paddock')
  assert.equal(validateAgentResponse(donutChart).success, true)

  const chartUpdate1 = await send('[mock:chart-update-1]', eligible)
  const chartUpdate2 = await send('[mock:chart-update-2]', eligible)
  const chartUpdateBar = await send('[mock:chart-update-bar]', eligible)
  assert.equal(chartUpdate1.artifacts[0].id, 'mock-updatable-chart')

  const loadTmf = await send('[mock:load-tmf]', eligible)
  assert.equal(loadTmf.actions[0].type, 'load_portal_item_layer')
  assert.equal(loadTmf.actions[0].portalItemId, '096c67f44e6d499ab1f016fde6893592')
  const loadMina = await send('[mock:load-mina]', eligible)
  assert.equal(loadMina.actions[0].layerId, 'asistente-imagen-mina')
  const showMina = await send('[mock:show-mina]', eligible)
  assert.equal(showMina.actions[0].type, 'load_portal_item_layer')
  assert.equal(showMina.actions[0].portalItemId, '80559637d5f54adb85dc470cf4398aaf')
  assert.equal(showMina.actions[0].zoom, true)
  const showTmf = await send('[mock:show-tmf]', eligible)
  assert.equal(showTmf.actions[0].type, 'load_portal_item_layer')
  assert.equal(showTmf.actions[0].zoom, true)
  const compare = await send('[mock:compare-imagery]', eligible)
  assert.equal(compare.actions.length, 2)
  assert.equal(compare.actions[1].opacity, 0.55)
  assert.equal(chartUpdate2.artifacts[0].id, chartUpdate1.artifacts[0].id)
  assert.equal(chartUpdateBar.artifacts[0].id, chartUpdate1.artifacts[0].id)
  assert.equal(chartUpdate1.artifacts[0].data.length, 3)
  assert.equal(chartUpdate2.artifacts[0].data.length, 4)
  assert.equal(chartUpdateBar.artifacts[0].chartType, 'bar')
  assert.equal(validateAgentResponse(chartUpdate1).success, true)
  assert.equal(validateAgentResponse(chartUpdate2).success, true)
  assert.equal(validateAgentResponse(chartUpdateBar).success, true)

  console.log('Mock agent runtime scenarios: A-Z passed')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
