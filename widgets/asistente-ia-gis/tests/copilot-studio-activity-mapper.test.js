/* Lightweight transport mapper tests. Run with Node from C:\EXP\client. */
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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText
  const localRequire = (request) => request.startsWith('.')
    ? loadTs(path.resolve(path.dirname(resolved), `${request}.ts`))
    : require(request)
  Function('require', 'module', 'exports', output)(localRequire, module, module.exports)
  return module.exports
}

const widgetRoot = path.resolve(__dirname, '..')
const { mapCopilotStudioActivities } = loadTs(path.join(widgetRoot, 'src/services/copilot-studio-activity-mapper.ts'))
const context = { requestId: 'request-1', conversationId: 'conversation-1' }
const base = (overrides = {}) => ({
  schemaVersion: '1.0',
  requestId: context.requestId,
  conversationId: context.conversationId,
  status: 'completed',
  message: 'Respuesta estructurada',
  ...overrides
})
const activity = (overrides = {}) => ({
  type: 'message',
  conversation: { id: context.conversationId },
  ...overrides
})
const invalidResponse = (callback) => assert.throws(callback, error => error?.code === 'INVALID_AGENT_RESPONSE')

assert.deepEqual(mapCopilotStudioActivities([activity({ text: 'Respuesta textual' })], context), base({ message: 'Respuesta textual' })) // A
assert.deepEqual(mapCopilotStudioActivities([activity({ value: base() })], context), base()) // B

const withAction = mapCopilotStudioActivities([activity({ value: base({
  actions: [{ id: 'zoom-1', title: 'Zoom', type: 'zoom_to_layer', layerId: 'layer-1' }]
}) })], context)
assert.equal(withAction.actions[0].type, 'zoom_to_layer') // C

const withArtifact = mapCopilotStudioActivities([activity({ value: base({
  artifacts: [{ id: 'pdf-1', title: 'Informe', type: 'pdf', url: 'https://example.test/report.pdf' }]
}) })], context)
assert.equal(withArtifact.artifacts[0].type, 'pdf') // D

invalidResponse(() => mapCopilotStudioActivities([activity({ value: base({ schemaVersion: '2.0' }) })], context)) // E
invalidResponse(() => mapCopilotStudioActivities([activity({ value: base({
  actions: [{ id: 'bad-1', title: 'Eliminar', type: 'delete_everything' }]
}) })], context)) // F
invalidResponse(() => mapCopilotStudioActivities([activity({ value: base({
  artifacts: [{ id: 'link-1', title: 'Enlace', type: 'link', url: 'javascript:alert(1)' }]
}) })], context)) // G
invalidResponse(() => mapCopilotStudioActivities([activity({ value: base({ requestId: 'request-other' }) })], context)) // H
invalidResponse(() => mapCopilotStudioActivities([activity({ text: 'No usar fallback', value: base({ schemaVersion: '2.0' }) })], context)) // I
assert.equal(mapCopilotStudioActivities([activity()], context), undefined) // J

const normalized = mapCopilotStudioActivities([activity({ value: base({ unexpected: 'discardar' }) })], context)
assert.equal(Object.prototype.hasOwnProperty.call(normalized, 'unexpected'), false) // K
assert.equal(mapCopilotStudioActivities(null, context), undefined)
assert.equal(mapCopilotStudioActivities(undefined, context), undefined) // L
assert.equal(mapCopilotStudioActivities([[]], context), undefined) // M
assert.equal(mapCopilotStudioActivities([{ type: 'message', text: 42 }], context), undefined) // N

invalidResponse(() => mapCopilotStudioActivities([activity({ text: 'Otra conversación', conversation: { id: 'conversation-other' } })], context))
invalidResponse(() => mapCopilotStudioActivities([activity({ value: base({ conversationId: 'conversation-other' }) })], context))

console.log('Copilot Studio activity mapper: A-N passed')