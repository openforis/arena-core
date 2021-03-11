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
  customMessages?: ValidationCustomMessages
  messageKey: string
  messageParams?: { [key: string]: any }
  severity?: ValidationSeverity
}

export const ValidationResultFactory: Factory<ValidationResult> = {
  createInstance: (params: ValidationResultFactoryParams): ValidationResult => {
    const defaultParams = {
      severity: ValidationSeverity.error,
    }
    const { severity, messageKey, messageParams, customMessages } = { ...defaultParams, ...params }
    return {
      severity,
      messageKey,
      messageParams,
      customMessages,
    }
  },
}
