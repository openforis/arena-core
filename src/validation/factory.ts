import { Factory } from 'src/common'
import { CustomMessages, Severity, Validation, ValidationResult } from './validation'

type ValidationFactoryParams = {
  errors: Array<ValidationResult>
  fields: {
    [name: string]: Validation
  }
  valid: boolean
  warnings: Array<ValidationResult>
}

const defaultProps = {
  valid: true,
  errors: <ValidationResult[]>[],
  warnings: <ValidationResult[]>[],
}

export const ValidationFactory: Factory<Validation> = {
  createInstance: (params: ValidationFactoryParams): Validation => {
    const { errors, fields, valid, warnings } = {
      ...defaultProps,
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
    const { severity, messageKey, messageParams, customMessages } = {
      ...defaultProps,
      ...params,
    }
    return {
      severity,
      messageKey,
      messageParams,
      customMessages,
    }
  },
}
