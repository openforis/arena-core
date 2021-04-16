import { Objects } from '../../utils'
import { ValidationResultFactory } from '../factory'
import { ValidationResult, ValidationSeverity } from '../validation'

/**
 * Internal name regular expression: it must contain only lowercase letters, numbers and underscores starting with a letter,
 * and it must be at most 40 characters long
 */
const nameRegex = /^[a-z][a-z0-9_]{0,39}$/

export const name = (messageKey: string) => (field: string, obj: any): ValidationResult => {
  const value = Objects.path(field)(obj)
  const valid = Objects.isEmpty(value) || nameRegex.test(value)
  return ValidationResultFactory.createInstance({
    valid,
    messageKey,
    severity: ValidationSeverity.error,
  })
}
