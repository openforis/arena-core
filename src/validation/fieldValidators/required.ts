import { Objects } from '../../utils/objects'

import { ValidationResultFactory } from '../factory'
import { ValidationResult } from '../validation'

export const required = (messageKey: string) => (field: string, obj: any): ValidationResult => {
  const value = obj?.[field]
  return Objects.isEmpty(value)
    ? ValidationResultFactory.createInstance({ messageKey })
    : <ValidationResult>(<unknown>null)
}
