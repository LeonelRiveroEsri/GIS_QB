import type { AgentArtifact, AgentArtifactMetadata, ChartAgentArtifact, ExternalAgentArtifact } from '../types/agent-artifact'
import { validateExternalUrl } from './external-url-validator'
import { MAX_CHART_POINTS, VALIDATION_LIMITS } from './validation-limits'
import { invalid, issue, valid, type ValidationIssue, type ValidationResult } from './validation-result'
import { isRecord, readString } from './validation-utils'

const EXTERNAL_ARTIFACT_TYPES = new Set<ExternalAgentArtifact['type']>(['pdf', 'map', 'image', 'table', 'link'])
const CHART_TYPES = new Set<ChartAgentArtifact['chartType']>(['line', 'bar', 'scatter', 'area', 'histogram', 'donut'])
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

const validateMetadata = (value: unknown, path: string, issues: ValidationIssue[]): AgentArtifactMetadata | undefined => {
  if (!isRecord(value)) {
    issues.push(issue(path, 'invalid_type', 'Metadata debe ser un objeto plano.'))
    return undefined
  }
  const keys = Object.keys(value)
  if (keys.length > VALIDATION_LIMITS.metadataKeys) {
    issues.push(issue(path, 'too_many_metadata_keys', `Metadata supera el máximo de ${VALIDATION_LIMITS.metadataKeys} claves.`))
    return undefined
  }
  const metadata: AgentArtifactMetadata = Object.create(null) as AgentArtifactMetadata
  keys.forEach(key => {
    const itemPath = `${path}.${key}`
    if (DANGEROUS_KEYS.has(key)) {
      issues.push(issue(itemPath, 'dangerous_metadata_key', 'La clave de metadata no está permitida.'))
      return
    }
    if (!key || key.length > VALIDATION_LIMITS.metadataKey) {
      issues.push(issue(itemPath, 'invalid_metadata_key', `La clave debe tener entre 1 y ${VALIDATION_LIMITS.metadataKey} caracteres.`))
      return
    }
    const item = value[key]
    if (typeof item === 'string') {
      if (item.length > VALIDATION_LIMITS.metadataString) issues.push(issue(itemPath, 'metadata_string_too_long', `El texto supera ${VALIDATION_LIMITS.metadataString} caracteres.`))
      else metadata[key] = item
    } else if (typeof item === 'number') {
      if (!Number.isFinite(item)) issues.push(issue(itemPath, 'invalid_number', 'El número debe ser finito.'))
      else metadata[key] = item
    } else if (typeof item === 'boolean' || item === null) metadata[key] = item
    else issues.push(issue(itemPath, 'invalid_metadata_value', 'El valor de metadata no está permitido.'))
  })
  return metadata
}

export const validateAgentArtifact = (value: unknown, path = 'artifact'): ValidationResult<AgentArtifact> => {
  if (!isRecord(value)) return invalid(issue(path, 'invalid_type', 'Debe ser un objeto de artifact.'))
  const issues: ValidationIssue[] = []
  const id = readString(value.id, `${path}.id`, issues, { nonEmpty: true, maxLength: VALIDATION_LIMITS.id })
  const title = readString(value.title, `${path}.title`, issues, { nonEmpty: true, maxLength: VALIDATION_LIMITS.label })
  const type = readString(value.type, `${path}.type`, issues, { nonEmpty: true, maxLength: 64 })
  if (type === 'chart') {
    const chartType = readString(value.chartType, `${path}.chartType`, issues, { nonEmpty: true, maxLength: 32 })
    if (chartType && !CHART_TYPES.has(chartType as ChartAgentArtifact['chartType'])) issues.push(issue(`${path}.chartType`, 'unsupported_chart_type', 'El tipo de gráfico no está permitido.'))
    const xField = readString(value.xField, `${path}.xField`, issues, { nonEmpty: true, maxLength: VALIDATION_LIMITS.metadataKey })
    const yField = readString(value.yField, `${path}.yField`, issues, { nonEmpty: true, maxLength: VALIDATION_LIMITS.metadataKey })
    const data: Array<Record<string, unknown>> = []
    if (!Array.isArray(value.data)) {
      issues.push(issue(`${path}.data`, 'invalid_type', 'Los datos del gráfico deben ser un array.'))
    } else if (value.data.length > MAX_CHART_POINTS) {
      issues.push(issue(`${path}.data`, 'too_many_chart_points', `Supera el máximo de ${MAX_CHART_POINTS} puntos.`))
    } else {
      value.data.forEach((row, index) => {
        if (!isRecord(row)) issues.push(issue(`${path}.data[${index}]`, 'invalid_type', 'Cada punto debe ser un objeto plano.'))
        else data.push({ ...row })
      })
    }
    if (issues.length || !id || !title || !chartType || !CHART_TYPES.has(chartType as ChartAgentArtifact['chartType']) || !xField || !yField) return invalid(...issues)
    return valid({ id, title, type: 'chart', chartType: chartType as ChartAgentArtifact['chartType'], xField, yField, data })
  }
  if (type && !EXTERNAL_ARTIFACT_TYPES.has(type as ExternalAgentArtifact['type'])) issues.push(issue(`${path}.type`, 'unsupported_artifact_type', 'El tipo de artifact no está permitido.'))
  const urlResult = value.url === undefined ? undefined : validateExternalUrl(value.url, `${path}.url`)
  if (urlResult && !urlResult.success) issues.push(...urlResult.issues)
  const metadata = value.metadata === undefined ? undefined : validateMetadata(value.metadata, `${path}.metadata`, issues)
  if (issues.length || !id || !title || !type || !EXTERNAL_ARTIFACT_TYPES.has(type as ExternalAgentArtifact['type'])) return invalid(...issues)
  return valid({
    id,
    title,
    type: type as ExternalAgentArtifact['type'],
    ...(urlResult?.success ? { url: urlResult.value } : {}),
    ...(metadata ? { metadata } : {})
  })
}

