import type { AgentAction } from '../../types/agent-action'
import {
  authorizeAgentAction,
  type AgentActionAuthorizationContext,
  type AgentActionAuthorizationResult
} from './agent-action-authorizer'
import {
  executeAgentAction,
  type AgentActionExecutionContext,
  type AgentActionExecutionResult
} from './agent-action-executor'

export type AuthorizedAgentActionResult = AgentActionAuthorizationResult | AgentActionExecutionResult

type ActionExecutor = (
  action: AgentAction,
  context: AgentActionExecutionContext
) => Promise<AgentActionExecutionResult>

/** Coordinates authorization before execution; intended to be called only from explicit UI interaction. */
export const handleAuthorizedAgentAction = async (
  action: AgentAction,
  authorizationContext: AgentActionAuthorizationContext,
  executionContext: AgentActionExecutionContext,
  executor: ActionExecutor = executeAgentAction
): Promise<AuthorizedAgentActionResult> => {
  const authorization = authorizeAgentAction(action, authorizationContext)
  if (!authorization.authorized) return authorization
  return await executor(action, executionContext)
}