import { ArenaLabels } from '../language'

export enum ValidationSeverity {
  error = 'error',
  warning = 'warning',
}

export interface ArenaValidationResult {
  severity?: ValidationSeverity
  key?: string
  params?: { [key: string]: any }
  messages?: ArenaLabels
  valid: boolean
}

export interface ArenaValidationCounts {
  errors: number
  warnings: number
}

export interface ArenaValidationFields {
  [key: string]: ArenaValidation
}

export interface ArenaValidation {
  errors?: ArenaValidationResult[]
  fields?: ArenaValidationFields
  valid: boolean
  warnings?: ArenaValidationResult[]
  counts?: ArenaValidationCounts
}
