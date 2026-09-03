import {
  BrowserAuthErrorCodes,
  BrowserCacheLocation,
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
  type IPublicClientApplication
} from '@azure/msal-browser'
import type { EntraAuthConfig } from '../config'
import { AgentClientError } from './agent-client'
import { AUTH_NOT_CONFIGURED, type TokenProvider, type TokenProviderOptions } from './token-provider'

type MsalClient = Pick<IPublicClientApplication,
'initialize' |
'getActiveAccount' |
'getAllAccounts' |
'setActiveAccount' |
'acquireTokenSilent' |
'acquireTokenPopup' |
'loginPopup'>

export const isEntraAuthConfigComplete = (config?: EntraAuthConfig): boolean => {
  if (!config?.enabled || !config.tenantId?.trim() || !config.clientId?.trim() || config.scopes?.length === 0) return false
  try {
    const redirectUri = new URL(config.redirectUri)
    return redirectUri.protocol === 'https:' || redirectUri.hostname === 'localhost'
  } catch {
    return false
  }
}

export class MsalTokenProvider implements TokenProvider {
  private readonly client: MsalClient
  private initialization?: Promise<void>

  constructor (
    private readonly config: EntraAuthConfig,
    client?: MsalClient,
    private readonly allowInteractive = true
  ) {
    this.client = client ?? new PublicClientApplication({
      auth: {
        clientId: config.clientId,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
        redirectUri: config.redirectUri
      },
      cache: {
        cacheLocation: BrowserCacheLocation.SessionStorage
      }
    })
  }

  async getAccessToken (options: TokenProviderOptions = {}): Promise<string> {
    if (!isEntraAuthConfigComplete(this.config)) {
      throw new AgentClientError(AUTH_NOT_CONFIGURED, 'La configuración de Microsoft Entra está incompleta o desactivada.', false)
    }
    this.throwIfCancelled(options.signal)

    try {
      this.initialization ??= this.client.initialize()
      await this.initialization
      this.throwIfCancelled(options.signal)

      const account = this.resolveAccount()
      if (!account) return await this.login(options.signal)

      try {
        const result = await this.client.acquireTokenSilent({
          account,
          scopes: this.config.scopes
        })
        this.throwIfCancelled(options.signal)
        return this.requireAccessToken(result)
      } catch (cause) {
        if (!this.requiresInteraction(cause)) throw cause
        if (!this.allowInteractive) {
          throw new AgentClientError('AUTH_LOGIN_REQUIRED', 'Se requiere iniciar sesión en Microsoft Entra.', false)
        }
        const result = await this.client.acquireTokenPopup({
          account,
          scopes: this.config.scopes,
          redirectUri: this.config.redirectUri
        })
        this.throwIfCancelled(options.signal)
        return this.requireAccessToken(result)
      }
    } catch (cause) {
      throw this.mapError(cause)
    }
  }

  private resolveAccount (): AccountInfo | undefined {
    const active = this.client.getActiveAccount()
    if (active) return active

    const accounts = this.client.getAllAccounts()
    if (accounts.length > 1) {
      throw new AgentClientError('AUTH_MULTIPLE_ACCOUNTS', 'Hay varias cuentas Microsoft disponibles. Selecciona una cuenta antes de continuar.', false)
    }
    if (accounts.length === 1) {
      this.client.setActiveAccount(accounts[0])
      return accounts[0]
    }
    return undefined
  }

  private async login (signal?: AbortSignal): Promise<string> {
    if (!this.allowInteractive) {
      throw new AgentClientError('AUTH_LOGIN_REQUIRED', 'Se requiere iniciar sesión en Microsoft Entra.', false)
    }
    const result = await this.client.loginPopup({
      scopes: this.config.scopes,
      redirectUri: this.config.redirectUri
    })
    this.throwIfCancelled(signal)
    if (result.account) this.client.setActiveAccount(result.account)
    return this.requireAccessToken(result)
  }

  private requireAccessToken (result: AuthenticationResult): string {
    const token = result.accessToken?.trim()
    if (!token) throw new AgentClientError('AUTH_TOKEN_FAILED', 'Microsoft Entra no devolvió un access token válido.', true)
    return token
  }

  private requiresInteraction (cause: unknown): boolean {
    if (cause instanceof InteractionRequiredAuthError) return true
    const code = this.errorCode(cause)
    return code === 'interaction_required' || code === 'consent_required' || code === 'login_required'
  }

  private mapError (cause: unknown): AgentClientError {
    if (cause instanceof AgentClientError) return cause
    const code = this.errorCode(cause)
    if (code === BrowserAuthErrorCodes.userCancelled || code === 'user_cancelled') {
      return new AgentClientError('AUTH_CANCELLED', 'El inicio de sesión fue cancelado.', false)
    }
    if (code === BrowserAuthErrorCodes.interactionInProgress || code === 'interaction_in_progress') {
      return new AgentClientError('AUTH_INTERACTION_IN_PROGRESS', 'Ya existe una interacción de autenticación en curso.', true)
    }
    return new AgentClientError('AUTH_TOKEN_FAILED', 'No fue posible obtener el token de Microsoft Entra.', true)
  }

  private errorCode (cause: unknown): string | undefined {
    return typeof cause === 'object' && cause !== null && 'errorCode' in cause
      ? String((cause as { errorCode?: unknown }).errorCode)
      : undefined
  }

  private throwIfCancelled (signal?: AbortSignal): void {
    if (signal?.aborted) throw new AgentClientError('AUTH_CANCELLED', 'La autenticación fue cancelada.', false)
  }
}
