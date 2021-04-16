import { Objects } from '../../utils'
import { ValidationResultFactory } from '../factory'
import { ValidationResult } from '../validation'
import { numeric } from './numeric'

export const numericPositive = (messageKey: string, messageParams: any = {}) => (
  field: string,
  obj: any
): ValidationResult | undefined => {
  const validateNumberResult = numeric(messageKey, messageParams)(field, obj)
  if (validateNumberResult) {
    return validateNumberResult
  }
  const value = Objects.path(field)(obj)
  return value && value <= 0 ? ValidationResultFactory.createInstance({ messageKey, messageParams }) : undefined
}
