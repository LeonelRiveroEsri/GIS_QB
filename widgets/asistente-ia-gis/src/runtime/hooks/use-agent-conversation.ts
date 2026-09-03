import { React } from 'jimu-core'
import { AgentClientError, type AgentClient } from '../../services/agent-client'
import { createAgentRequest } from '../../services/agent-request'
import type { AgentError } from '../../types/agent-response'
import type { GisContext } from '../../types/gis-context'
import type { AgentAction } from '../../types/agent-action'
import type { AgentArtifact } from '../../types/agent-artifact'
import { AgentResponseValidationError } from '../../validation/agent-response-validator'

export type AgentUiStatus = 'idle' | 'sending' | 'completed' | 'error' | 'cancelled'

export interface ConversationMessage {
  id: string
  role: 'assistant' | 'user'
  title?: string
  content: string
  actions?: AgentAction[]
  artifacts?: AgentArtifact[]
}

interface UseAgentConversationOptions {
  agentClient: AgentClient
  welcomeMessage: string
  responseTitle?: string
  gisContext?: GisContext
  timeoutMs?: number
}

const createId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
const welcome = (content: string): ConversationMessage[] => [{ id: createId('welcome'), role: 'assistant', content }]

export const useAgentConversation = ({
  agentClient,
  welcomeMessage,
  responseTitle,
  gisContext,
  timeoutMs = 10000
}: UseAgentConversationOptions) => {
  const [messages, setMessages] = React.useState<ConversationMessage[]>(() => welcome(welcomeMessage))
  const [status, setStatus] = React.useState<AgentUiStatus>('idle')
  const [error, setError] = React.useState<AgentError>()
  const [conversationId, setConversationId] = React.useState<string>()
  const activeController = React.useRef<AbortController>()
  const operationSequence = React.useRef(0)
  const sending = React.useRef(false)

  React.useEffect(() => {
    setMessages(current => current.length === 1 && current[0].role === 'assistant'
      ? [{ ...current[0], content: welcomeMessage }]
      : current)
  }, [welcomeMessage])

  const sendMessage = React.useCallback((rawMessage: string): boolean => {
    const message = rawMessage.trim()
    if (!message || sending.current) return false

    sending.current = true
    setStatus('sending')
    setError(undefined)

    const operation = ++operationSequence.current
    const controller = new AbortController()
    activeController.current = controller
    const requestId = createId('request')
    const request = createAgentRequest({
      requestId,
      message,
      conversationId,
      gisContext,
      history: messages.map(({ role, content }) => ({ role, content }))
    })

    setMessages(current => [...current, { id: createId('user'), role: 'user', content: message }])

    void agentClient.send(request, { signal: controller.signal, timeoutMs })
      .then(response => {
        if (operation !== operationSequence.current) return
        setConversationId(response.conversationId)

        if (response.status === 'cancelled') {
          setStatus('cancelled')
          return
        }

        if (response.status === 'failed') {
          setError(response.error || { code: 'agent-failed', message: response.message, retryable: true })
          setStatus('error')
          return
        }

        setMessages(current => [...current, {
          id: createId('assistant'),
          role: 'assistant',
          title: responseTitle,
          content: response.message,
          actions: response.actions,
          artifacts: response.artifacts
        }])
        setStatus('completed')
      })
      .catch((cause: Error) => {
        if (operation !== operationSequence.current) return
        if (cause.name === 'AbortError') {
          setStatus('cancelled')
          return
        }
        setError(cause instanceof AgentResponseValidationError
          ? { code: cause.code, message: cause.message, retryable: false }
          : cause instanceof AgentClientError
          ? { code: cause.code, message: cause.message, retryable: cause.retryable, correlationId: cause.correlationId }
          : {
              code: cause.name === 'TimeoutError' ? 'timeout' : 'agent-client-error',
              message: cause.message,
              retryable: true
            })
        setStatus('error')
      })
      .finally(() => {
        if (operation !== operationSequence.current) return
        sending.current = false
        activeController.current = undefined
      })

    return true
  }, [agentClient, conversationId, gisContext, messages, responseTitle, timeoutMs])

  const cancel = React.useCallback(() => activeController.current?.abort(), [])

  const resetConversation = React.useCallback(() => {
    operationSequence.current++
    activeController.current?.abort()
    activeController.current = undefined
    sending.current = false
    setMessages(welcome(welcomeMessage))
    setStatus('idle')
    setError(undefined)
    setConversationId(undefined)
  }, [welcomeMessage])

  return { messages, status, error, conversationId, sendMessage, cancel, resetConversation }
}
