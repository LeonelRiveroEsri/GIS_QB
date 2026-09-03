import type { GisContext } from './gis-context'

export interface AgentConversationMessage {
  role: 'assistant' | 'user'
  content: string
}

export interface AgentRequest {
  schemaVersion: '1.0'
  requestId: string
  message: string
  conversationId?: string
  gisContext?: GisContext
  history?: AgentConversationMessage[]
}
