import { type ImmutableObject } from 'seamless-immutable'

export interface Config {
  widgetTitle: string
  welcomeMessage: string
  includeMapContext: boolean
  maxContextLayers: number
  copilotStudio: CopilotStudioConfig
  auth: EntraAuthConfig
}

export interface CopilotStudioConfig {
  enabled: boolean
  endpoint: string
  timeoutMs: number
}

export interface EntraAuthConfig {
  enabled: boolean
  tenantId: string
  clientId: string
  redirectUri: string
  scopes: string[]
}

export type IMConfig = ImmutableObject<Config>
