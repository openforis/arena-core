import { Objects } from '../utils'
import { ValidationFactory } from './factory'
import { Validation, ValidationFields, ValidationResult } from './validation'

const getValidation = (obj: any): Validation => obj.validation || ValidationFactory.createInstance()

const getFieldValidations = (validation: Validation): ValidationFields => validation.fields || {}

const getFieldValidation =
  (field: string) =>
  (validation: Validation): Validation =>
    getFieldValidations(validation)[field] || ValidationFactory.createInstance()

const getErrors = (validation: Validation): ValidationResult[] => validation.errors || []

const getWarnings = (validation: Validation): ValidationResult[] => validation.warnings || []

const hasErrors = (validation: Validation): boolean => {
  const errors = getErrors(validation)
  return !Objects.isEmpty(errors) || Object.values(getFieldValidations(validation)).some(hasErrors)
}

const hasWarnings = (validation: Validation): boolean => {
  const warnings = getWarnings(validation)
  return !Objects.isEmpty(warnings) || Object.values(getFieldValidations(validation)).some(hasWarnings)
}

const recalculateValidity = (validation: Validation): Validation => {
  let allFieldsValid = true

  const fieldsWithValidationRecalculated: ValidationFields = {}

  Object.entries(validation.fields).forEach(([fieldKey, fieldValidation]) => {
    const fieldValidationUpdated = recalculateValidity(fieldValidation)
    fieldsWithValidationRecalculated[fieldKey] = fieldValidationUpdated
    if (!fieldValidationUpdated.valid) {
      allFieldsValid = false
    }
  })
  const valid: boolean = allFieldsValid && !hasErrors(validation) && !hasWarnings(validation)

  return ValidationFactory.createInstance({
    valid,
    fields: fieldsWithValidationRecalculated,
    errors: getErrors(validation),
    warnings: getWarnings(validation),
  })
}

const cleanup = (validation: Validation): Validation => {
  let allFieldsValid = true

  const fieldsCleaned = Object.entries(getFieldValidations(validation)).reduce(
    (fieldsAcc, [field, fieldValidation]) => {
      const fieldValidationCleaned = cleanup(fieldValidation)
      if (!fieldValidationCleaned.valid) {
        allFieldsValid = false
        Objects.assoc({ obj: fieldsAcc, prop: field, value: fieldValidationCleaned, sideEffect: true })
      }
      return fieldsAcc
    },
    {}
  )

  return ValidationFactory.createInstance({
    valid: allFieldsValid && !hasErrors(validation) && !hasWarnings(validation),
    fields: fieldsCleaned,
    errors: getErrors(validation),
    warnings: getWarnings(validation),
  })
}

const mergeValidations =
  (validationNext: Validation) =>
  (validationPrev: Validation): Validation => {
    const validationFieldsResult = { ...getFieldValidations(validationPrev) }
    const validationFieldsNext = getFieldValidations(validationNext)

    // iterate over new field validations: remove valid ones, merge invalid ones with previous ones
    Object.entries(validationFieldsNext).forEach(([fieldKey, validationFieldNext]) => {
      if (validationFieldNext.valid) {
        // field validation valid: remove it from resulting validation
        delete validationFieldsResult[fieldKey]
      } else {
        // field validation not valid: deep merge it with the previous one
        const previousFieldValidation = validationFieldsResult[fieldKey]
        validationFieldsResult[fieldKey] = Objects.deepMerge(
          previousFieldValidation,
          validationFieldNext
        ) as unknown as Validation
      }
    })
    const validationResult = ValidationFactory.createInstance({ ...validationPrev, fields: validationFieldsResult })
    return cleanup(validationResult)
  }

const dissocFieldValidation =
  (fieldKey: string, sideEffect = false) =>
  (validation: Validation): Validation =>
    Objects.dissocPath({ obj: validation, path: ['fields', fieldKey], sideEffect })

const dissocFieldValidationsStartingWith =
  (fieldStartsWith: string, sideEffect = false) =>
  (validation: Validation): Validation => {
    if (!validation.fields) return validation

    const fieldsUpdated = sideEffect ? validation.fields : { ...validation.fields }
    Object.keys(fieldsUpdated).forEach((fieldKey: string) => {
      if (!fieldKey.startsWith(fieldStartsWith)) {
        delete fieldsUpdated[fieldKey]
      }
    })
    if (sideEffect) {
      validation.fields = fieldsUpdated
      return validation
    }
    return { ...validation, fields: fieldsUpdated }
  }

export const Validations = {
  getValidation,
  getFieldValidations,
  getFieldValidation,
  recalculateValidity,
  cleanup,
  mergeValidations,
  dissocFieldValidation,
  dissocFieldValidationsStartingWith,
}
