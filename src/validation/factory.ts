import { Factory } from '../common'
import { Labels } from '../language'
import { Validation, ValidationResult, ValidationSeverity } from './validation'

type ValidationFactoryParams = {
  errors?: Array<ValidationResult>
  fields?: {
    [name: string]: Validation
  }
  valid?: boolean
  warnings?: Array<ValidationResult>
}

export const ValidationFactory: Factory<Validation, ValidationFactoryParams> = {
  createInstance: (params: ValidationFactoryParams): Validation => {
    const defaultParams = {
      valid: true,
      errors: new Array<ValidationResult>(),
      warnings: new Array<ValidationResult>(),
      fields: {},
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
  customMessages?: Labels
  key?: string
  params?: { [key: string]: any }
  severity?: ValidationSeverity
  valid?: boolean
}

export const ValidationResultFactory: Factory<ValidationResult, ValidationResultFactoryParams> = {
  createInstance: (params: ValidationResultFactoryParams = {}): ValidationResult => {
    const defaultParams = {
      valid: true,
    }

    const { severity, key, params: _params, customMessages, valid } = { ...defaultParams, ...params }
    return {
      severity,
      key,
      params: _params,
      customMessages,
      valid,
    }
  },
}
