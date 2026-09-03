import type { AgentRequest } from '../types/agent-request'
import type { AgentResponse } from '../types/agent-response'

export interface AgentClientOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

export interface AgentClient {
  send: (request: AgentRequest, options?: AgentClientOptions) => Promise<AgentResponse>
}

export class AgentClientError extends Error {
  readonly code: string
  readonly retryable: boolean
  readonly correlationId?: string

  constructor (code: string, message: string, retryable = false, correlationId?: string) {
    super(message)
    this.name = code
    this.code = code
    this.retryable = retryable
    this.correlationId = correlationId
  }
}
