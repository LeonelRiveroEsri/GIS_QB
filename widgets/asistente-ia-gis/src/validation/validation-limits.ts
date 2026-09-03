export const VALIDATION_LIMITS = {
  id: 256,
  label: 500,
  message: 20000,
  url: 4096,
  actions: 20,
  artifacts: 20,
  metadataKeys: 50,
  metadataKey: 256,
  metadataString: 4096
} as const

/** Prevents an agent response from creating an excessively large chart in the UI. */
export const MAX_CHART_POINTS = 200

