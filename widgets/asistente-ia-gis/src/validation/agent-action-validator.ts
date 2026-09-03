import type { AgentAction } from '../types/agent-action'
import type { GisExtent, GisSpatialReference } from '../types/gis-context'
import { validateExternalUrl } from './external-url-validator'
import { VALIDATION_LIMITS } from './validation-limits'
import { invalid, issue, valid, type ValidationIssue, type ValidationResult } from './validation-result'
import { isRecord, readFiniteNumber, readPositiveInteger, readString } from './validation-utils'

const validateExtent = (value: unknown, path: string, issues: ValidationIssue[]): GisExtent | undefined => {
  if (!isRecord(value)) {
    issues.push(issue(path, 'invalid_type', 'Debe ser un objeto de extensión.'))
    return undefined
  }
  const xmin = readFiniteNumber(value.xmin, `${path}.xmin`, issues)
  const ymin = readFiniteNumber(value.ymin, `${path}.ymin`, issues)
  const xmax = readFiniteNumber(value.xmax, `${path}.xmax`, issues)
  const ymax = readFiniteNumber(value.ymax, `${path}.ymax`, issues)
  if (xmin !== undefined && xmax !== undefined && xmin > xmax) issues.push(issue(path, 'invalid_extent_x', 'xmin no puede ser mayor que xmax.'))
  if (ymin !== undefined && ymax !== undefined && ymin > ymax) issues.push(issue(path, 'invalid_extent_y', 'ymin no puede ser mayor que ymax.'))
  return xmin === undefined || ymin === undefined || xmax === undefined || ymax === undefined
    ? undefined
    : { xmin, ymin, xmax, ymax }
}

const validateSpatialReference = (value: unknown, path: string, issues: ValidationIssue[]): GisSpatialReference | undefined => {
  if (!isRecord(value)) {
    issues.push(issue(path, 'invalid_type', 'Debe ser una referencia espacial.'))
    return undefined
  }
  const spatialReference: GisSpatialReference = {}
  if (value.wkid !== undefined) spatialReference.wkid = readPositiveInteger(value.wkid, `${path}.wkid`, issues)
  if (value.latestWkid !== undefined) spatialReference.latestWkid = readPositiveInteger(value.latestWkid, `${path}.latestWkid`, issues)
  if (value.wkid === undefined && value.latestWkid === undefined) {
    issues.push(issue(path, 'spatial_reference_empty', 'Debe incluir wkid o latestWkid.'))
  }
  return spatialReference
}

export const validateAgentAction = (value: unknown, path = 'action'): ValidationResult<AgentAction> => {
  if (!isRecord(value)) return invalid(issue(path, 'invalid_type', 'Debe ser un objeto de acción.'))
  const issues: ValidationIssue[] = []
  const id = readString(value.id, `${path}.id`, issues, { nonEmpty: true, maxLength: VALIDATION_LIMITS.id })
  const title = readString(value.title, `${path}.title`, issues, { nonEmpty: true, maxLength: VALIDATION_LIMITS.label })
  const type = readString(value.type, `${path}.type`, issues, { nonEmpty: true, maxLength: 64 })
  if (!id || !title || !type) return invalid(...issues)

  if (type === 'zoom_to_extent') {
    const extent = validateExtent(value.extent, `${path}.extent`, issues)
    const spatialReference = value.spatialReference === undefined
      ? undefined
      : validateSpatialReference(value.spatialReference, `${path}.spatialReference`, issues)
    return issues.length || !extent ? invalid(...issues) : valid({ id, title, type, extent, ...(spatialReference ? { spatialReference } : {}) })
  }
  if (type === 'zoom_to_layer') {
    const layerId = readString(value.layerId, `${path}.layerId`, issues, { nonEmpty: true, maxLength: VALIDATION_LIMITS.id })
    return issues.length || !layerId ? invalid(...issues) : valid({ id, title, type, layerId })
  }
  if (type === 'set_layer_visibility') {
    const layerId = readString(value.layerId, `${path}.layerId`, issues, { nonEmpty: true, maxLength: VALIDATION_LIMITS.id })
    if (typeof value.visible !== 'boolean') issues.push(issue(`${path}.visible`, 'invalid_type', 'Debe ser boolean.'))
    return issues.length || !layerId ? invalid(...issues) : valid({ id, title, type, layerId, visible: value.visible as boolean })
  }
  if (type === 'load_portal_item_layer') {
    const portalItemId = readString(value.portalItemId, `${path}.portalItemId`, issues, { nonEmpty: true, maxLength: 32 })
    const layerId = readString(value.layerId, `${path}.layerId`, issues, { nonEmpty: true, maxLength: VALIDATION_LIMITS.id })
    if (portalItemId && !/^[a-f0-9]{32}$/i.test(portalItemId)) issues.push(issue(`${path}.portalItemId`, 'invalid_portal_item_id', 'El Portal Item ID no es válido.'))
    if (value.opacity !== undefined && (typeof value.opacity !== 'number' || !Number.isFinite(value.opacity) || value.opacity < 0 || value.opacity > 1)) issues.push(issue(`${path}.opacity`, 'invalid_opacity', 'La opacidad debe estar entre 0 y 1.'))
    if (value.zoom !== undefined && typeof value.zoom !== 'boolean') issues.push(issue(`${path}.zoom`, 'invalid_type', 'Debe ser boolean.'))
    return issues.length || !portalItemId || !layerId ? invalid(...issues) : valid({ id, title, type, portalItemId, layerId, ...(value.opacity !== undefined ? { opacity: value.opacity as number } : {}), ...(value.zoom !== undefined ? { zoom: value.zoom as boolean } : {}) })
  }
  if (type === 'set_layer_opacity') {
    const layerId = readString(value.layerId, `${path}.layerId`, issues, { nonEmpty: true, maxLength: VALIDATION_LIMITS.id })
    if (typeof value.opacity !== 'number' || !Number.isFinite(value.opacity) || value.opacity < 0 || value.opacity > 1) issues.push(issue(`${path}.opacity`, 'invalid_opacity', 'La opacidad debe estar entre 0 y 1.'))
    return issues.length || !layerId ? invalid(...issues) : valid({ id, title, type, layerId, opacity: value.opacity as number })
  }
  if (type === 'open_url') {
    const urlResult = validateExternalUrl(value.url, `${path}.url`)
    if (!urlResult.success) issues.push(...urlResult.issues)
    return issues.length || !urlResult.success ? invalid(...issues) : valid({ id, title, type, url: urlResult.value })
  }
  issues.push(issue(`${path}.type`, 'unsupported_action_type', 'El tipo de acción no está permitido.'))
  return invalid(...issues)
}

