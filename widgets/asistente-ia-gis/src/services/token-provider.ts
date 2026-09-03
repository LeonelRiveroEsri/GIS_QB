import { AgentClientError } from './agent-client'

export const AUTH_NOT_CONFIGURED = 'AUTH_NOT_CONFIGURED'

export interface TokenProviderOptions {
  signal?: AbortSignal
}

export interface TokenProvider {
  getAccessToken: (options?: TokenProviderOptions) => Promise<string>
}

/** Safe default until delegated Microsoft Entra authentication is configured. */
export class UnconfiguredTokenProvider implements TokenProvider {
  async getAccessToken (): Promise<string> {
    throw new AgentClientError(
      AUTH_NOT_CONFIGURED,
      'La autenticación delegada de Microsoft Entra todavía no está configurada.',
      false
    )
  }
}
