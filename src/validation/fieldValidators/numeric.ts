import { Objects } from '../../utils'
import { ValidationResultFactory } from '../factory'
import { ValidationResult, ValidationSeverity } from '../validation'

export const numeric = (messageKey = 'invalid_number', messageParams: any = {}) => (
  field: string,
  obj: any
): ValidationResult => {
  const value = Objects.path(field)(obj)
  const valid = Objects.isEmpty(value) || !isNaN(value)

  return ValidationResultFactory.createInstance({
    valid,
    messageKey,
    messageParams,
    severity: ValidationSeverity.error,
  })
}
