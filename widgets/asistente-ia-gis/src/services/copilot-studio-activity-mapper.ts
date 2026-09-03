import type { AgentResponse } from '../types/agent-response'
import { AgentResponseValidationError, requireValidAgentResponse } from '../validation/agent-response-validator'
import { issue } from '../validation/validation-result'

export interface CopilotStudioActivityMappingContext {
  requestId: string
  conversationId: string
}

type ExternalObject = { readonly [key: string]: unknown }

const isExternalObject = (value: unknown): value is ExternalObject =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const hasOwn = (value: ExternalObject, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key)

const invalidIdentity = (path: string, code: string, message: string): never => {
  throw new AgentResponseValidationError([issue(path, code, message)])
}

const validateActivityConversation = (activity: ExternalObject, expectedConversationId: string): void => {
  if (activity.conversation === undefined) return
  if (!isExternalObject(activity.conversation)) {
    invalidIdentity('activity.conversation', 'invalid_type', 'La conversación de la actividad debe ser un objeto.')
  }
  const conversationId = activity.conversation.id
  if (conversationId === undefined) return
  if (typeof conversationId !== 'string' || conversationId.trim().length === 0) {
    invalidIdentity('activity.conversation.id', 'invalid_type', 'El identificador de conversación de la actividad no es válido.')
  }
  if (conversationId.trim() !== expectedConversationId) {
    invalidIdentity('activity.conversation.id', 'conversation_id_mismatch', 'La actividad no corresponde con la conversación activa.')
  }
}

const validateResponseIdentity = (
  response: AgentResponse,
  context: CopilotStudioActivityMappingContext
): AgentResponse => {
  if (response.requestId !== context.requestId) {
    invalidIdentity('requestId', 'request_id_mismatch', 'La respuesta no corresponde con la solicitud activa.')
  }
  if (response.conversationId !== context.conversationId) {
    invalidIdentity('conversationId', 'conversation_id_mismatch', 'La respuesta no corresponde con la conversación activa.')
  }
  return response
}

/** Maps untrusted SDK activities without importing the SDK Activity runtime. */
export const mapCopilotStudioActivities = (
  value: unknown,
  context: CopilotStudioActivityMappingContext
): AgentResponse | undefined => {
  if (!Array.isArray(value)) return undefined

  const activities = [...value].reverse()
  const structuredActivity = activities.find(activity =>
    isExternalObject(activity) && hasOwn(activity, 'value') && activity.value !== undefined
  )

  if (isExternalObject(structuredActivity)) {
    validateActivityConversation(structuredActivity, context.conversationId)
    const response = requireValidAgentResponse(structuredActivity.value)
    return validateResponseIdentity(response, context)
  }

  const textActivity = activities.find(activity =>
    isExternalObject(activity) &&
    activity.type === 'message' &&
    typeof activity.text === 'string' &&
    activity.text.trim().length > 0
  )

  if (!isExternalObject(textActivity) || typeof textActivity.text !== 'string') return undefined
  validateActivityConversation(textActivity, context.conversationId)

  return requireValidAgentResponse({
    schemaVersion: '1.0',
    requestId: context.requestId,
    conversationId: context.conversationId,
    status: 'completed',
    message: textActivity.text
  })
}