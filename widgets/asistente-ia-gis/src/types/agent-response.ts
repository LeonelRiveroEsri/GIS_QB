export type AgentResponseStatus = 'completed' | 'processing' | 'failed' | 'cancelled'

export interface AgentError {
  code: string
  message: string
  retryable: boolean
  correlationId?: string
}

export interface AgentResponse {
  schemaVersion: '1.0'
  requestId: string
  conversationId: string
  status: AgentResponseStatus
  message: string
  error?: AgentError
  actions?: AgentAction[]
  artifacts?: AgentArtifact[]
}
import type { AgentAction } from './agent-action'
import type { AgentArtifact } from './agent-artifact'
