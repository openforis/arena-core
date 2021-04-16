import { Objects } from '../../utils'
import { ValidationResultFactory } from '../factory'
import { ValidationResult } from '../validation'

/**
 * Email regular expression
 */
const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export const email = (messageKey: string) => (field: string, obj: any): ValidationResult | undefined => {
  const value = Objects.path(field)(obj)
  return value && !emailRegex.test(value) ? ValidationResultFactory.createInstance({ messageKey }) : undefined
}
