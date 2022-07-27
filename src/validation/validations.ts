import { Objects } from '../utils'
import { ValidationFactory } from './factory'
import { Validation } from './validation'

const recalculateValidity = (validation: Validation): Validation => {
  let allFieldValidationsValid = true
  const fieldsWithValidationRecalculated: { [key: string]: Validation } = {}
  Object.entries(validation.fields).forEach(([fieldKey, fieldValidation]) => {
    const fieldValidationUpdated = recalculateValidity(fieldValidation)
    fieldsWithValidationRecalculated[fieldKey] = fieldValidationUpdated
    if (!fieldValidationUpdated.valid) {
      allFieldValidationsValid = false
    }
  })
  const errors = validation.errors
  const warnings = validation.warnings
  const valid: boolean = allFieldValidationsValid && Objects.isEmpty(errors) && Objects.isEmpty(warnings)
  return ValidationFactory.createInstance({ valid, fields: fieldsWithValidationRecalculated, errors, warnings })
}

export const Validations = {
  recalculateValidity,
}
