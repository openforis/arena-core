import { LanguageCode } from 'src/language'

export enum ValidationSeverity {
  error = 'error',
  warning = 'warning',
}

export type ValidationCustomMessages = {
  [code in LanguageCode]?: string
}

export interface ValidationResult {
  severity: ValidationSeverity
  messageKey: string
  messageParams?: { [key: string]: any }
  customMessages?: ValidationCustomMessages
}

export interface Validation {
  errors: ValidationResult[]
  fields: {
    [name: string]: Validation
  }
  valid: boolean
  warnings: ValidationResult[]
}
