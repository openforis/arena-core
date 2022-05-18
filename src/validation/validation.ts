import { Labels } from '../language'

export enum ValidationSeverity {
  error = 'error',
  warning = 'warning',
}

export interface ValidationResult {
  severity?: ValidationSeverity
  key?: string
  params?: { [key: string]: any }
  customMessages?: Labels
  valid: boolean
}

export interface ValidationCounts {
  errors: number
  warnings: number
}

export interface Validation {
  errors: ValidationResult[]
  fields: {
    [name: string]: Validation
  }
  valid: boolean
  warnings: ValidationResult[]
  counts?: ValidationCounts
}
