import { Objects } from '../../utils'

import { ValidationResultFactory } from '../factory'
import { ValidationResult } from '../validation'

export const required = (messageKey: string) => (field: string, obj: any): ValidationResult | undefined => {
  const value = Objects.path(field)(obj)
  return Objects.isEmpty(value) ? ValidationResultFactory.createInstance({ messageKey }) : undefined
}
