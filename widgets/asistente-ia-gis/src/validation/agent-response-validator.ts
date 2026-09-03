import type { AgentAction } from '../types/agent-action'
import type { AgentArtifact } from '../types/agent-artifact'
import type { AgentError, AgentResponse, AgentResponseStatus } from '../types/agent-response'
import { validateAgentAction } from './agent-action-validator'
import { validateAgentArtifact } from './agent-artifact-validator'
import { VALIDATION_LIMITS } from './validation-limits'
import { invalid, issue, valid, type ValidationIssue, type ValidationResult } from './validation-result'
import { isRecord, readString } from './validation-utils'

const STATUSES = new Set<AgentResponseStatus>(['completed', 'processing', 'failed', 'cancelled'])

const validateError = (value: unknown, path: string, issues: ValidationIssue[]): AgentError | undefined => {
  if (!isRecord(value)) {
    issues.push(issue(path, 'invalid_type', 'Debe ser un objeto de error.'))
    return undefined
  }
  const code = readString(value.code, `${path}.code`, issues, { nonEmpty: true, maxLength: VALIDATION_LIMITS.id })
  const message = readString(value.message, `${path}.message`, issues, { maxLength: VALIDATION_LIMITS.message })
  if (typeof value.retryable !== 'boolean') issues.push(issue(`${path}.retryable`, 'invalid_type', 'Debe ser boolean.'))
  const correlationId = value.correlationId === undefined
    ? undefined
    : readString(value.correlationId, `${path}.correlationId`, issues, { nonEmpty: true, maxLength: VALIDATION_LIMITS.id })
  return !code || message === undefined || typeof value.retryable !== 'boolean'
    ? undefined
    : { code, message, retryable: value.retryable, ...(correlationId ? { correlationId } : {}) }
}

export const validateAgentResponse = (value: unknown): ValidationResult<AgentResponse> => {
  if (!isRecord(value)) return invalid(issue('$', 'invalid_type', 'La respuesta debe ser un objeto plano.'))
  const issues: ValidationIssue[] = []
  if (value.schemaVersion !== '1.0') issues.push(issue('schemaVersion', 'unsupported_schema_version', 'La versión del esquema no está permitida.'))
  const requestId = readString(value.requestId, 'requestId', issues, { nonEmpty: true, maxLength: VALIDATION_LIMITS.id })
  const conversationId = readString(value.conversationId, 'conversationId', issues, { nonEmpty: true, maxLength: VALIDATION_LIMITS.id })
  const status = readString(value.status, 'status', issues, { nonEmpty: true, maxLength: 32 })
  if (status && !STATUSES.has(status as AgentResponseStatus)) issues.push(issue('status', 'unsupported_status', 'El estado no está permitido.'))
  const message = readString(value.message, 'message', issues, { maxLength: VALIDATION_LIMITS.message })
  const error = value.error === undefined ? undefined : validateError(value.error, 'error', issues)

  const actions: AgentAction[] = []
  if (value.actions !== undefined) {
    if (!Array.isArray(value.actions)) issues.push(issue('actions', 'invalid_type', 'Debe ser un array.'))
    else if (value.actions.length > VALIDATION_LIMITS.actions) issues.push(issue('actions', 'too_many_actions', `Supera el máximo de ${VALIDATION_LIMITS.actions} acciones.`))
    else value.actions.forEach((action, index) => {
      const result = validateAgentAction(action, `actions[${index}]`)
      if (result.success) actions.push(result.value)
      else issues.push(...result.issues)
    })
  }

  const artifacts: AgentArtifact[] = []
  if (value.artifacts !== undefined) {
    if (!Array.isArray(value.artifacts)) issues.push(issue('artifacts', 'invalid_type', 'Debe ser un array.'))
    else if (value.artifacts.length > VALIDATION_LIMITS.artifacts) issues.push(issue('artifacts', 'too_many_artifacts', `Supera el máximo de ${VALIDATION_LIMITS.artifacts} artifacts.`))
    else value.artifacts.forEach((artifact, index) => {
      const result = validateAgentArtifact(artifact, `artifacts[${index}]`)
      if (result.success) artifacts.push(result.value)
      else issues.push(...result.issues)
    })
  }

  if (issues.length || !requestId || !conversationId || !status || message === undefined || !STATUSES.has(status as AgentResponseStatus)) return invalid(...issues)
  return valid({
    schemaVersion: '1.0',
    requestId,
    conversationId,
    status: status as AgentResponseStatus,
    message,
    ...(error ? { error } : {}),
    ...(value.actions !== undefined ? { actions } : {}),
    ...(value.artifacts !== undefined ? { artifacts } : {})
  })
}

export class AgentResponseValidationError extends Error {
  readonly code = 'INVALID_AGENT_RESPONSE'
  readonly issues: ValidationIssue[]

  constructor (issues: ValidationIssue[]) {
    super('La respuesta del asistente no tiene un formato válido.')
    this.name = 'AgentResponseValidationError'
    this.issues = issues
  }
}

export const requireValidAgentResponse = (value: unknown): AgentResponse => {
  const result = validateAgentResponse(value)
  if (!result.success) throw new AgentResponseValidationError(result.issues)
  return result.value
}
