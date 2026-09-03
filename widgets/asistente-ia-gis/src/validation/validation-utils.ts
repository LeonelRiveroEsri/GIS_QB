import { issue, type ValidationIssue } from './validation-result'

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export const readString = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  options: { nonEmpty?: boolean, maxLength: number }
): string | undefined => {
  if (typeof value !== 'string') {
    issues.push(issue(path, 'invalid_type', 'Debe ser un texto.'))
    return undefined
  }
  if (options.nonEmpty && value.trim().length === 0) {
    issues.push(issue(path, 'empty_string', 'No puede estar vacío.'))
    return undefined
  }
  if (value.length > options.maxLength) {
    issues.push(issue(path, 'string_too_long', `Supera el máximo de ${options.maxLength} caracteres.`))
    return undefined
  }
  return value
}

export const readFiniteNumber = (value: unknown, path: string, issues: ValidationIssue[]): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push(issue(path, 'invalid_number', 'Debe ser un número finito.'))
    return undefined
  }
  return value
}

export const readPositiveInteger = (value: unknown, path: string, issues: ValidationIssue[]): number | undefined => {
  if (!Number.isInteger(value) || (value as number) <= 0) {
    issues.push(issue(path, 'invalid_positive_integer', 'Debe ser un entero positivo.'))
    return undefined
  }
  return value as number
}

