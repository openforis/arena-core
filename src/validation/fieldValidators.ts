import { ValidationResultFactory } from './factory'
import { ValidationResult } from './validation'

export type FieldValidator = (prop: string, obj: any) => ValidationResult

const isEmpty = (value: any) =>
  value === null ||
  value === '' ||
  Number.isNaN(value) ||
  (value instanceof Object && value.length === 0) ||
  (Array.isArray(value) && value.length === 0)

export const required = (messageKey: string) => (prop: string, obj: any): ValidationResult => {
  const value = obj?.[prop]
  if (isEmpty(value)) {
    return ValidationResultFactory.createInstance({ messageKey })
  }
  return <ValidationResult>(<unknown>null)
}
