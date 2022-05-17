import { Objects } from '../../utils'

import { ValidationResultFactory } from '../factory'
import { ValidationResult, ValidationSeverity } from '../validation'

export const required =
  (messageKey: string) =>
  (field: string, obj: any): ValidationResult => {
    const value = Objects.path(field)(obj)
    const valid = !Objects.isEmpty(value)
    return ValidationResultFactory.createInstance({
      valid,
      key: messageKey,
      severity: ValidationSeverity.error,
    })
  }
