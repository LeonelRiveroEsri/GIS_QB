import { ConnectionSettings, CopilotStudioClient } from '@microsoft/agents-copilotstudio-client'
import type { AgentRequest } from '../types/agent-request'
import type { AgentResponse } from '../types/agent-response'
import { AgentResponseValidationError } from '../validation/agent-response-validator'
import { AgentClientError, type AgentClient, type AgentClientOptions } from './agent-client'
import { mapCopilotStudioActivities } from './copilot-studio-activity-mapper'
import type { TokenProvider } from './token-provider'

export interface CopilotStudioAgentClientConfig {
  endpoint: string
  timeoutMs: number
}

/** Adapter from the widget contract to Microsoft's official Copilot Studio client. */
export class CopilotStudioAgentClient implements AgentClient {
  constructor (
    private readonly config: CopilotStudioAgentClientConfig,
    private readonly tokenProvider: TokenProvider
  ) {}

  async send (request: AgentRequest, options: AgentClientOptions = {}): Promise<AgentResponse> {
    this.validateConfig()

    // Authentication is resolved before the SDK client is created. The safe
    // default provider throws AUTH_NOT_CONFIGURED and prevents any SDK request.
    const token = (await this.tokenProvider.getAccessToken({ signal: options.signal })).trim()
    if (!token) {
      throw new AgentClientError('AUTH_TOKEN_EMPTY', 'El proveedor de autenticación no entregó un access token.', false)
    }

    const settings = new ConnectionSettings({ directConnectUrl: this.config.endpoint })
    const client = new CopilotStudioClient(settings, token)
    const timeoutMs = options.timeoutMs ?? this.config.timeoutMs

    try {
      return await this.withControl(async () => {
        let conversationId = request.conversationId?.trim()

        if (!conversationId) {
          const startResponse = await client.startConversationWithResponse(true)
          conversationId = startResponse.conversationId?.trim()
        }

        if (!conversationId) {
          throw new AgentClientError('CONVERSATION_ID_MISSING', 'Copilot Studio no devolvió un identificador de conversación.', true)
        }

        const activities = await client.askQuestionAsync(request.message, conversationId)
        const response = mapCopilotStudioActivities(activities, {
          requestId: request.requestId,
          conversationId
        })

        if (!response) {
          throw new AgentClientError('EMPTY_AGENT_RESPONSE', 'Copilot Studio no devolvió una respuesta textual.', true)
        }
        return response
      }, timeoutMs, options.signal)
    } catch (cause) {
      if (cause instanceof AgentClientError || cause instanceof AgentResponseValidationError) throw cause
      const message = cause instanceof Error ? cause.message : 'Error inesperado al comunicarse con Copilot Studio.'
      throw new AgentClientError('COPILOT_STUDIO_SDK_ERROR', message, true)
    }
  }

  private validateConfig (): void {
    if (!this.config.endpoint?.trim()) {
      throw new AgentClientError('ENDPOINT_NOT_CONFIGURED', 'El endpoint de Copilot Studio no está configurado.', false)
    }
    try {
      const endpoint = new URL(this.config.endpoint)
      if (endpoint.protocol !== 'https:' || !endpoint.pathname.includes('/conversations')) throw new Error()
    } catch {
      throw new AgentClientError('ENDPOINT_INVALID', 'El endpoint de Copilot Studio debe ser una URL HTTPS de conversaciones válida.', false)
    }
  }

  private async withControl<T> (
    operation: () => Promise<T>,
    timeoutMs: number,
    signal?: AbortSignal
  ): Promise<T> {
    if (signal?.aborted) throw new AgentClientError('AbortError', 'La solicitud fue cancelada.', false)

    return await new Promise<T>((resolve, reject) => {
      let settled = false
      const finish = (callback: () => void) => {
        if (settled) return
        settled = true
        window.clearTimeout(timeout)
        signal?.removeEventListener('abort', cancel)
        callback()
      }
      const cancel = () => finish(() => reject(new AgentClientError('AbortError', 'La solicitud fue cancelada.', false)))
      const timeout = window.setTimeout(() => finish(() => reject(new AgentClientError(
        'TimeoutError',
        'Copilot Studio excedió el tiempo máximo de espera.',
        true
      ))), timeoutMs)

      signal?.addEventListener('abort', cancel, { once: true })
      void operation().then(
        value => finish(() => resolve(value)),
        cause => finish(() => reject(cause))
      )
    })
  }
}
