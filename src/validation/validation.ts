import { LanguageCode } from 'src/language'

export enum Severity {
  error = 'error',
  warning = 'warning',
}

export type CustomMessages = {
  [code in LanguageCode]?: string
}

export interface ValidationResult {
  severity: Severity
  messageKey: string
  messageParams?: { [key: string]: any }
  customMessages?: CustomMessages
}

export interface Validation {
  errors: ValidationResult[]
  fields: {
    [name: string]: Validation
  }
  valid: boolean
  warnings: ValidationResult[]
}
