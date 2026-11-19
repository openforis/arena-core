import { Objects } from '../../utils'
import { ValidationResultFactory } from '../factory'
import { ArenaValidationResult, ValidationSeverity } from '../validation'

export const numeric =
  (messageKey = 'invalid_number', messageParams: any = {}) =>
  (field: string, obj: any): Promise<ArenaValidationResult> => {
    const value = Objects.path(field)(obj)
    const valid = Objects.isEmpty(value) || !Number.isNaN(Number(value))

    return Promise.resolve(
      ValidationResultFactory.createInstance({
        valid,
        key: messageKey,
        params: messageParams,
        severity: ValidationSeverity.error,
      })
    )
  }
