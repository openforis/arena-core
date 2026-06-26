import { Dictionary, Factory } from '../common'
import { Labels } from '../language'
import { Objects } from '../utils'
import { Validation, ValidationResult, ValidationSeverity } from './validation'

type ValidationFactoryParams = {
  errors?: ValidationResult[]
  fields?: Dictionary<Validation>
  valid?: boolean
  warnings?: ValidationResult[]
}

export const ValidationFactory: Factory<Validation, ValidationFactoryParams> = {
  createInstance: (params?: ValidationFactoryParams): Validation => {
    const defaultParams = {
      valid: true,
    }
    const { errors, fields, valid, warnings } = {
      ...defaultParams,
      ...(params ?? {}),
    }
    const result: Validation = { valid }
    if (Objects.isNotEmpty(errors)) {
      result.errors = errors
    }
    if (Objects.isNotEmpty(fields)) {
      result.fields = fields
    }
    if (Objects.isNotEmpty(warnings)) {
      result.warnings = warnings
    }
    return result
  },
}

type ValidationResultFactoryParams = {
  messages?: Labels
  key?: string
  params?: Dictionary<any>
  severity?: ValidationSeverity
  valid?: boolean
}

export const ValidationResultFactory: Factory<ValidationResult, ValidationResultFactoryParams> = {
  createInstance: (params: ValidationResultFactoryParams = {}): ValidationResult => {
    const defaultParams = {
      valid: true,
    }
    const { severity: severityParam, key, params: _params, messages, valid } = { ...defaultParams, ...params }
    const severity = !severityParam && !valid ? ValidationSeverity.error : severityParam
    return {
      severity,
      key,
      params: _params,
      messages,
      valid,
    }
  },
}
