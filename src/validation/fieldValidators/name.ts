import { Objects } from '../../utils'
import { ValidationResultFactory } from '../factory'
import { ValidationResult, ValidationSeverity } from '../validation'

/**
 * Internal name regular expression: it must contain only lowercase letters, numbers and underscores starting with a letter,
 * and it must be at most 40 characters long
 */
const nameRegex = /^[a-z][a-z0-9_]{0,39}$/

export const name =
  (messageKey: string) =>
  async (field: string, obj: any): Promise<ValidationResult> => {
    const value = Objects.path(field)(obj)
    const valid = Objects.isEmpty(value) || nameRegex.test(value)
    return ValidationResultFactory.createInstance({
      valid,
      key: messageKey,
      severity: ValidationSeverity.error,
    })
  }
