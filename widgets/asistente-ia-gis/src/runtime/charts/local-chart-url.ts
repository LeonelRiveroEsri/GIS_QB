const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])
const LOCAL_PROTOCOLS = new Set(['http:', 'https:'])

export const isAllowedLocalChartUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return LOCAL_PROTOCOLS.has(url.protocol) &&
      LOCAL_HOSTS.has(url.hostname) &&
      !url.username &&
      !url.password
  } catch {
    return false
  }
}