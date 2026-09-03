import { sanitizeContextUrl } from '../utils/sanitize-url'
import { VALIDATION_LIMITS } from './validation-limits'
import { invalid, issue, valid, type ValidationResult } from './validation-result'

const LOCAL_HTTP_HOSTS = new Set(['localhost', '127.0.0.1'])

/** Sanitization removes sensitive query parameters; validation establishes trust. */
export const validateExternalUrl = (value: unknown, path = 'url'): ValidationResult<string> => {
  if (typeof value !== 'string') return invalid(issue(path, 'invalid_type', 'Debe ser una URL de texto.'))
  if (value.length === 0 || value.length > VALIDATION_LIMITS.url) {
    return invalid(issue(path, 'invalid_url_length', `La URL debe tener entre 1 y ${VALIDATION_LIMITS.url} caracteres.`))
  }

  const sanitized = sanitizeContextUrl(value)
  if (!sanitized) return invalid(issue(path, 'invalid_url', 'La URL no tiene un formato válido.'))

  try {
    const url = new URL(sanitized)
    const isHttps = url.protocol === 'https:'
    const isLocalHttp = url.protocol === 'http:' && LOCAL_HTTP_HOSTS.has(url.hostname.toLowerCase())
    if (!isHttps && !isLocalHttp) {
      return invalid(issue(path, 'unsafe_url_protocol', 'La URL no utiliza un protocolo permitido.'))
    }
    if (url.username || url.password) {
      return invalid(issue(path, 'url_credentials_not_allowed', 'La URL no puede incluir credenciales.'))
    }
    return valid(url.toString())
  } catch {
    return invalid(issue(path, 'invalid_url', 'La URL no tiene un formato válido.'))
  }
}

