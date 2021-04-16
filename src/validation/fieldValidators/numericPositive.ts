import { Objects } from '../../utils'
import { ValidationResultFactory } from '../factory'
import { ValidationResult, ValidationSeverity } from '../validation'
import { numeric } from './numeric'

export const numericPositive = (messageKey: string, messageParams: any = {}) => (
  field: string,
  obj: any
): ValidationResult => {
  const validateNumberResult = numeric(messageKey, messageParams)(field, obj)
  if (!validateNumberResult.valid) {
    return validateNumberResult
  }
  const value = Objects.path(field)(obj)
  const valid = Objects.isEmpty(value) || value >= 0

  return ValidationResultFactory.createInstance({
    valid,
    messageKey,
    messageParams,
    severity: ValidationSeverity.error,
  })
}
