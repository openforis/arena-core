import { Labels } from '../language'

export enum ValidationSeverity {
  error = 'error',
  warning = 'warning',
}

export interface ValidationResult {
  severity?: ValidationSeverity
  key?: string
  params?: { [key: string]: any }
  messages?: Labels
  valid: boolean
}

export interface ValidationCounts {
  errors: number
  warnings: number
}

export interface ValidationFields {
  [key: string]: Validation
}

export interface Validation {
  errors?: ValidationResult[]
  fields?: ValidationFields
  valid: boolean
  warnings?: ValidationResult[]
  counts?: ValidationCounts
}
