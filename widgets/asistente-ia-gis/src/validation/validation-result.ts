export interface ValidationIssue {
  path: string
  code: string
  message: string
}

export type ValidationResult<T> =
  | { success: true, value: T }
  | { success: false, issues: ValidationIssue[] }

export const valid = <T>(value: T): ValidationResult<T> => ({ success: true, value })

export const invalid = <T = never>(...issues: ValidationIssue[]): ValidationResult<T> => ({
  success: false,
  issues
})

export const issue = (path: string, code: string, message: string): ValidationIssue => ({ path, code, message })

