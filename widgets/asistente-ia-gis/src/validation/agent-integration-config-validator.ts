export type AgentIntegrationConfigIssueCode =
  | 'AUTH_TENANT_ID_REQUIRED'
  | 'AUTH_CLIENT_ID_REQUIRED'
  | 'AUTH_REDIRECT_URI_REQUIRED'
  | 'AUTH_REDIRECT_URI_INVALID'
  | 'AUTH_SCOPES_REQUIRED'
  | 'COPILOT_AUTH_REQUIRED'
  | 'COPILOT_ENDPOINT_REQUIRED'
  | 'COPILOT_ENDPOINT_INVALID'

export interface AgentIntegrationConfigIssue {
  code: AgentIntegrationConfigIssueCode
  field: string
  message: string
}

export interface AgentIntegrationConfigInput {
  auth?: {
    enabled?: boolean
    tenantId?: string
    clientId?: string
    redirectUri?: string
    scopes?: readonly string[]
  }
  copilotStudio?: {
    enabled?: boolean
    endpoint?: string
  }
}

export interface AgentIntegrationConfigValidationResult {
  valid: boolean
  issues: AgentIntegrationConfigIssue[]
}

const hasText = (value?: string): boolean => typeof value === 'string' && value.trim().length > 0

const isValidRedirectUri = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1'))
  } catch {
    return false
  }
}

const isValidCopilotEndpoint = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.pathname.includes('/conversations')
  } catch {
    return false
  }
}

/** Validates dormant or enabled integration settings without authentication or network access. */
export const validateAgentIntegrationConfig = (
  config: AgentIntegrationConfigInput
): AgentIntegrationConfigValidationResult => {
  const issues: AgentIntegrationConfigIssue[] = []
  const auth = config.auth
  const copilotStudio = config.copilotStudio
  const authEnabled = auth?.enabled === true
  const copilotEnabled = copilotStudio?.enabled === true

  if (authEnabled) {
    if (!hasText(auth?.tenantId)) issues.push({ code: 'AUTH_TENANT_ID_REQUIRED', field: 'auth.tenantId', message: 'Falta configurar el tenant de Microsoft Entra.' })
    if (!hasText(auth?.clientId)) issues.push({ code: 'AUTH_CLIENT_ID_REQUIRED', field: 'auth.clientId', message: 'Falta configurar el cliente SPA de Microsoft Entra.' })
    if (!hasText(auth?.redirectUri)) {
      issues.push({ code: 'AUTH_REDIRECT_URI_REQUIRED', field: 'auth.redirectUri', message: 'Falta configurar la URI de redirección autorizada.' })
    } else if (!isValidRedirectUri(auth.redirectUri)) {
      issues.push({ code: 'AUTH_REDIRECT_URI_INVALID', field: 'auth.redirectUri', message: 'La URI de redirección configurada no es válida.' })
    }
    if (!auth?.scopes?.some(hasText)) issues.push({ code: 'AUTH_SCOPES_REQUIRED', field: 'auth.scopes', message: 'Falta configurar al menos un scope delegado.' })
  }

  if (copilotEnabled) {
    if (!authEnabled) issues.push({ code: 'COPILOT_AUTH_REQUIRED', field: 'auth.enabled', message: 'Copilot Studio requiere autenticación Microsoft Entra habilitada.' })
    if (!hasText(copilotStudio?.endpoint)) {
      issues.push({ code: 'COPILOT_ENDPOINT_REQUIRED', field: 'copilotStudio.endpoint', message: 'Falta configurar el endpoint de Copilot Studio.' })
    } else if (!isValidCopilotEndpoint(copilotStudio.endpoint)) {
      issues.push({ code: 'COPILOT_ENDPOINT_INVALID', field: 'copilotStudio.endpoint', message: 'El endpoint de Copilot Studio no es una URL HTTPS de conversaciones válida.' })
    }
  }

  return { valid: issues.length === 0, issues }
}