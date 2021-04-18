import { Labels } from '../language'

export enum ValidationSeverity {
  error = 'error',
  warning = 'warning',
}

export interface ValidationResult {
  severity?: ValidationSeverity
  messageKey?: string
  messageParams?: { [key: string]: any }
  customMessages?: Labels
  valid: boolean
}

export interface Validation {
  errors: ValidationResult[]
  fields: {
    [name: string]: Validation
  }
  valid: boolean
  warnings: ValidationResult[]
}
