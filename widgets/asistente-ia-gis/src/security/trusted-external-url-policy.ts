export interface TrustedHostRule {
  hostname: string
  allowSubdomains?: boolean
}

export type TrustedUrlRejectionReason =
  | 'invalid_url'
  | 'protocol_not_allowed'
  | 'credentials_not_allowed'
  | 'host_not_allowed'
  | 'port_not_allowed'
  | 'sensitive_query_not_allowed'

export type TrustedUrlPolicyResult =
  | { trusted: true, url: string }
  | { trusted: false, reason: TrustedUrlRejectionReason }

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])
const SENSITIVE_QUERY_PARAMETERS = new Set(['token', 'access_token', 'apikey', 'sig', 'signature'])

export const PROJECT_TRUSTED_HOSTS: readonly TrustedHostRule[] = [
  { hostname: 'teckresources.sharepoint.com' },
  { hostname: 'teck-qb2.maps.arcgis.com' },
  { hostname: '04ab42a0aa15e4028f705db8155b64.07.environment.api.powerplatform.com' }
]

const normalizeRule = (rule: TrustedHostRule): TrustedHostRule => ({
  hostname: rule.hostname.trim().toLowerCase().replace(/\.$/, ''),
  ...(rule.allowSubdomains ? { allowSubdomains: true } : {})
})

const matchesRule = (hostname: string, rule: TrustedHostRule): boolean => {
  const normalized = normalizeRule(rule)
  if (!normalized.hostname) return false
  return hostname === normalized.hostname ||
    (normalized.allowSubdomains === true && hostname.endsWith(`.${normalized.hostname}`))
}

/** Determines domain trust only; it never opens, downloads, or requests the URL. */
export const checkTrustedExternalUrl = (
  value: string,
  rules: readonly TrustedHostRule[] = PROJECT_TRUSTED_HOSTS
): TrustedUrlPolicyResult => {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return { trusted: false, reason: 'invalid_url' }
  }

  if (url.username || url.password) return { trusted: false, reason: 'credentials_not_allowed' }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '')
  const isLocal = LOCAL_HOSTS.has(hostname)
  if (isLocal) {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { trusted: false, reason: 'protocol_not_allowed' }
    }
  } else {
    if (url.protocol !== 'https:') return { trusted: false, reason: 'protocol_not_allowed' }
    if (url.port !== '') return { trusted: false, reason: 'port_not_allowed' }
    if (!rules.some(rule => matchesRule(hostname, rule))) {
      return { trusted: false, reason: 'host_not_allowed' }
    }
  }

  for (const key of url.searchParams.keys()) {
    if (SENSITIVE_QUERY_PARAMETERS.has(key.toLowerCase())) {
      return { trusted: false, reason: 'sensitive_query_not_allowed' }
    }
  }

  return { trusted: true, url: url.toString() }
}

export const trustedExternalUrlPolicy = {
  check: checkTrustedExternalUrl,
  isTrusted: (value: string): boolean => checkTrustedExternalUrl(value).trusted
}