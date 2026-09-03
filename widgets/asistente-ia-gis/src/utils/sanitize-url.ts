const SENSITIVE_QUERY_PARAMETERS = new Set([
  'token',
  'access_token',
  'apikey',
  'sig',
  'signature'
])

/** Returns a sanitized copy without ever mutating the original URL string. */
export const sanitizeContextUrl = (value?: string): string | undefined => {
  if (!value?.trim()) return undefined

  try {
    const url = new URL(value)
    const keysToDelete: string[] = []
    url.searchParams.forEach((_, key) => {
      if (SENSITIVE_QUERY_PARAMETERS.has(key.toLowerCase())) keysToDelete.push(key)
    })
    keysToDelete.forEach(key => url.searchParams.delete(key))
    return url.toString()
  } catch {
    return undefined
  }
}
