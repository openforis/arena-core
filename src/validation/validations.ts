import { Objects } from '../utils'
import { ValidationFactory } from './factory'
import { Validation } from './validation'

const recalculateValidity = (validation: Validation): Validation => {
  const fieldsWithValidationRecalculated: { [key: string]: Validation } = Object.entries(validation.fields).reduce(
    (acc, [fieldKey, fieldValidation]) => ({ ...acc, [fieldKey]: recalculateValidity(fieldValidation) }),
    {}
  )
  const errors = validation.errors
  const warnings = validation.warnings
  const valid: boolean =
    Object.values(fieldsWithValidationRecalculated).every((fieldValidation) => fieldValidation.valid) &&
    Objects.isEmpty(errors) &&
    Objects.isEmpty(warnings)
  return ValidationFactory.createInstance({ valid, fields: fieldsWithValidationRecalculated, errors, warnings })
}

export const Validations = {
  recalculateValidity,
}
