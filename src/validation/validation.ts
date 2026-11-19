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

/** Alias of ValidationResult, not clashing with the ValidationResult modules of the consumers. */
export type ArenaValidationResult = ValidationResult

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

/** Alias of Validation, not clashing with the Validation modules of the consumers. */
export type ArenaValidation = Validation
