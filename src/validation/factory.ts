import { ArenaDictionary, ArenaFactory } from '../common'
import { ArenaLabels } from '../language'
import { Objects } from '../utils'
import { ArenaValidation, ArenaValidationResult, ValidationSeverity } from './validation'

type ValidationFactoryParams = {
  errors?: ArenaValidationResult[]
  fields?: ArenaDictionary<ArenaValidation>
  valid?: boolean
  warnings?: ArenaValidationResult[]
}

export const ValidationFactory: ArenaFactory<ArenaValidation, ValidationFactoryParams> = {
  createInstance: (params?: ValidationFactoryParams): ArenaValidation => {
    const defaultParams = {
      valid: true,
    }
    const { errors, fields, valid, warnings } = {
      ...defaultParams,
      ...params,
    }
    const result: ArenaValidation = { valid }
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
  messages?: ArenaLabels
  key?: string
  params?: ArenaDictionary<any>
  severity?: ValidationSeverity
  valid?: boolean
}

export const ValidationResultFactory: ArenaFactory<ArenaValidationResult, ValidationResultFactoryParams> = {
  createInstance: (params: ValidationResultFactoryParams = {}): ArenaValidationResult => {
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
