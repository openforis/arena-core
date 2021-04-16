import { Objects } from '../../utils'
import { ValidationResultFactory } from '../factory'
import { ValidationResult } from '../validation'

/**
 * Internal name regular expression: it must contain only lowercase letters, numbers and underscores starting with a letter,
 * and it must be at most 40 characters long
 */
const nameRegex = /^[a-z][a-z0-9_]{0,39}$/

export const name = (messageKey: string) => (field: string, obj: any): ValidationResult | undefined => {
  const value = Objects.path(field)(obj)
  return value && !nameRegex.test(value) ? ValidationResultFactory.createInstance({ messageKey }) : undefined
}
