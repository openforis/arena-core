import { Objects } from '../../utils'
import { ValidationResultFactory } from '../factory'
import { ValidationResult, ValidationSeverity } from '../validation'
import { numeric } from './numeric'

export const numericPositive =
  (messageKey: string, messageParams: any = {}) =>
  async (field: string, obj: any): Promise<ValidationResult> => {
    const validateNumberResult = await numeric(messageKey, messageParams)(field, obj)
    if (!validateNumberResult.valid) {
      return validateNumberResult
    }
    const value = Objects.path(field)(obj)
    const valid = Objects.isEmpty(value) || value >= 0

    return ValidationResultFactory.createInstance({
      valid,
      key: messageKey,
      params: messageParams,
      severity: ValidationSeverity.error,
    })
  }
