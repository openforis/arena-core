import { ValidationResultFactory } from '../factory'
import { ValidationResult } from '../validation'

export const numeric = (messageKey = 'invalid_number', messageParams: any = {}) => (
  field: string,
  obj: any
): ValidationResult => {
  const value = obj?.[field]
  return value && isNaN(value)
    ? ValidationResultFactory.createInstance({ messageKey, messageParams })
    : <ValidationResult>(<unknown>null)
}
