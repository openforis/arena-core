import { Factory } from 'src/common'
import { Validation, ValidationCustomMessages, ValidationResult, ValidationSeverity } from './validation'

type ValidationFactoryParams = {
  errors: Array<ValidationResult>
  fields: {
    [name: string]: Validation
  }
  valid: boolean
  warnings: Array<ValidationResult>
}

export const ValidationFactory: Factory<Validation> = {
  createInstance: (params: ValidationFactoryParams): Validation => {
    const defaultParams = {
      valid: true,
      errors: new Array<ValidationResult>(),
      warnings: new Array<ValidationResult>(),
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
  severity: ValidationSeverity
  messageKey: string
  messageParams?: { [key: string]: any }
  customMessages?: ValidationCustomMessages
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
