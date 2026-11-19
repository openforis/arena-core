import { Objects } from '../../utils'

import { ValidationResultFactory } from '../factory'
import { ArenaValidationResult, ValidationSeverity } from '../validation'

export const required =
  (messageKey: string) =>
  (field: string, obj: any): Promise<ArenaValidationResult> => {
    const value = Objects.path(field)(obj)
    const valid = !Objects.isEmpty(value)
    return Promise.resolve(
      ValidationResultFactory.createInstance({
        valid,
        key: messageKey,
        severity: ValidationSeverity.error,
      })
    )
  }
