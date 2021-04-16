import { Objects } from '../../utils'
import { ValidationResultFactory } from '../factory'
import { ValidationResult, ValidationSeverity } from '../validation'

/**
 * Email regular expression
 */
const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export const email = (messageKey: string) => (field: string, obj: any): ValidationResult => {
  const value = Objects.path(field)(obj)
  const valid = Objects.isEmpty(value) || emailRegex.test(value)

  return ValidationResultFactory.createInstance({
    valid,
    messageKey,
    severity: ValidationSeverity.error,
  })
}
