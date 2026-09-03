import type { AgentConversationMessage, AgentRequest } from '../types/agent-request'
import type { GisContext } from '../types/gis-context'

interface CreateAgentRequestOptions {
  requestId: string
  message: string
  history?: AgentConversationMessage[]
  gisContext?: GisContext
  conversationId?: string
}

export const createAgentRequest = ({
  requestId,
  message,
  history,
  gisContext,
  conversationId
}: CreateAgentRequestOptions): AgentRequest => ({
  schemaVersion: '1.0',
  requestId,
  message,
  ...(conversationId ? { conversationId } : {}),
  ...(gisContext ? { gisContext } : {}),
  ...(history ? { history } : {})
})
