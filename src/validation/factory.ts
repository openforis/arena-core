import { Factory } from 'src/common'
import { CustomMessages, Severity, Validation, ValidationResult } from './validation'

type ValidationFactoryParams = {
  errors: ValidationResult[]
  fields: {
    [name: string]: Validation
  }
  valid: boolean
  warnings: ValidationResult[]
}

export const ValidationFactory: Factory<Validation> = {
  createInstance: (params: ValidationFactoryParams): Validation => {
    const defaultParams = {
      valid: true,
      errors: <ValidationResult[]>[],
      warnings: <ValidationResult[]>[],
    }
    const { errors, fields, valid, warnings } = {
      ...defaultParams,
      ...params,
    }
    return {
      errors,
      fields,
      valid,
      warnings,
    }
  },
}

type ValidationResultFactoryParams = {
  severity: Severity
  messageKey: string
  messageParams?: { [key: string]: any }
  customMessages?: CustomMessages
}

export const ValidationResultFactory: Factory<ValidationResult> = {
  createInstance: (params: ValidationResultFactoryParams): ValidationResult => {
    const { severity, messageKey, messageParams, customMessages } = params
    return {
      severity,
      messageKey,
      messageParams,
      customMessages,
    }
  },
}
