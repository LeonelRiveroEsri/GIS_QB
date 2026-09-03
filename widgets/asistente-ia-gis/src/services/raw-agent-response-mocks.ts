export type MalformedAgentResponseScenario =
  | 'invalid-action'
  | 'invalid-url'
  | 'invalid-artifact'
  | 'oversized'

const baseResponse = (): Record<string, unknown> => ({
  schemaVersion: '1.0',
  requestId: 'mock-invalid-request',
  conversationId: 'mock-invalid-conversation',
  status: 'completed',
  message: 'Raw mock destinado exclusivamente a validar el boundary externo.'
})

/** Deliberately returns unknown so malformed payloads cannot masquerade as AgentResponse. */
export const createMalformedAgentResponseMock = (scenario: MalformedAgentResponseScenario): unknown => {
  const response = baseResponse()
  if (scenario === 'invalid-action') {
    response.actions = [{ id: 'invalid-action', type: 'delete_everything', title: 'Acción inválida' }]
  } else if (scenario === 'invalid-url') {
    response.actions = [{ id: 'invalid-url', type: 'open_url', title: 'URL inválida', url: 'javascript:alert(1)' }]
  } else if (scenario === 'invalid-artifact') {
    response.artifacts = [{ id: 'invalid-artifact', type: 'executable', title: 'Artifact inválido' }]
  } else {
    response.actions = Array.from({ length: 21 }, (_, index) => ({
      id: `oversized-${index}`,
      type: 'zoom_to_layer',
      title: `Acción ${index}`,
      layerId: `layer-${index}`
    }))
  }
  return response
}

