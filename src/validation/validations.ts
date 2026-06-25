import { Objects } from '../utils'
import { ValidationFactory } from './factory'
import { Validation, ValidationCounts, ValidationFields, ValidationResult } from './validation'

const keys = {
  fields: 'fields',
  errors: 'errors',
  warnings: 'warnings',
  valid: 'valid',
  validation: 'validation',
}

const hasValidation = (obj: any): boolean => !!obj.validation

const getValidation = (obj: any): Validation => obj.validation || ValidationFactory.createInstance()

const getFieldValidations = (validation: Validation): ValidationFields => validation.fields ?? {}

const getFieldValidation =
  (field: string) =>
  (validation: Validation): Validation =>
    getFieldValidations(validation)[field] || ValidationFactory.createInstance()

const getErrors = (validation: Validation): ValidationResult[] => validation.errors ?? []

const getWarnings = (validation: Validation): ValidationResult[] => validation.warnings ?? []

const hasErrors = (validation: Validation): boolean => {
  const errors = getErrors(validation)
  return !Objects.isEmpty(errors) || Object.values(getFieldValidations(validation)).some(hasErrors)
}

const hasWarnings = (validation: Validation): boolean => {
  const warnings = getWarnings(validation)
  return !Objects.isEmpty(warnings) || Object.values(getFieldValidations(validation)).some(hasWarnings)
}

const isValid = (validation: Validation): boolean => Objects.isEmpty(validation) || validation.valid
const isNotValid = (validation: Validation): boolean => !isValid(validation)
const isObjValid = (obj: Record<string, unknown>): boolean => isValid(getValidation(obj))

const getCounts = (validation: Validation): ValidationCounts | undefined => validation.counts
const getErrorsCount = (validation: Validation): number => getCounts(validation)?.errors ?? 0
const getWarningsCount = (validation: Validation): number => getCounts(validation)?.warnings ?? 0

const recalculateValidity = (validation: Validation): Validation => {
  let allFieldsValid = true

  const fieldsWithValidationRecalculated: ValidationFields = {}

  Object.entries(validation.fields ?? {}).forEach(([fieldKey, fieldValidation]) => {
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

const traverse = (visitor: (visitedItem: Validation) => void) => (validation: Validation) => {
  const stack: Validation[] = []
  stack.push(validation)

  while (stack.length) {
    const validationCurrent = stack.pop()!
    visitor(validationCurrent)
    // Add field validations to stack
    const validationFields = getFieldValidations(validationCurrent)
    stack.push(...Object.values(validationFields))
  }
}

const calculateCounts = (validation: Validation): ValidationCounts => {
  let errors = 0
  let warnings = 0

  traverse((validationCurrent) => {
    errors += getErrors(validationCurrent).length
    warnings += getWarnings(validationCurrent).length
  })(validation)

  return {
    errors,
    warnings,
  }
}

const updateCounts = (validation: Validation): Validation => ({
  ...validation,
  counts: calculateCounts(validation),
})

const calculateHasNestedErrors = (validation: Validation): boolean => calculateCounts(validation).errors > 0
const calculateHasNestedWarnings = (validation: Validation): boolean => calculateCounts(validation).warnings > 0

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
      if (fieldKey.startsWith(fieldStartsWith)) {
        delete fieldsUpdated[fieldKey]
      }
    })
    if (sideEffect) {
      validation.fields = fieldsUpdated
      return validation
    }
    return { ...validation, fields: fieldsUpdated }
  }

export const mergeValidation =
  (validationNext: Validation, doCleanup = true) =>
  (validationPrev: Validation): Validation => {
    const validationFieldsResult: ValidationFields = {
      ...getFieldValidations(validationPrev),
    }
    const validationFieldsNext = getFieldValidations(validationNext)

    // iterate over new field validations: remove valid ones, merge invalid ones with previous ones
    for (const [fieldKey, validationFieldNext] of Object.entries(validationFieldsNext)) {
      if (isValid(validationFieldNext)) {
        if (doCleanup) {
          // field validation valid: remove it from resulting validation
          delete validationFieldsResult[fieldKey]
        } else {
          validationFieldsResult[fieldKey] = ValidationFactory.createInstance()
        }
      } else {
        // field validation not valid: deep merge it with the previous one
        const validationFieldPrev = validationFieldsResult[fieldKey]
        const validationFieldMerged = validationFieldPrev
          ? mergeValidation(validationFieldNext, false)(validationFieldPrev)
          : validationFieldNext
        validationFieldsResult[fieldKey] = validationFieldMerged
      }
    }

    const validationResult: Validation = { ...validationPrev, fields: validationFieldsResult }
    validationResult.errors = getErrors(validationNext)
    validationResult.warnings = getWarnings(validationNext)

    return doCleanup ? cleanup(validationResult) : recalculateValidity(validationResult)
  }

const mergeFieldValidations = (
  fieldValidationsNext: ValidationFields,
  fieldValidationsPrev: ValidationFields
): ValidationFields => {
  const result: ValidationFields = { ...fieldValidationsPrev }
  for (const [fieldKey, fieldValidationNext] of Object.entries(fieldValidationsNext)) {
    const fieldValidationPrev = fieldValidationsPrev[fieldKey]
    result[fieldKey] = fieldValidationPrev
      ? mergeValidation(fieldValidationNext, false)(fieldValidationPrev)
      : fieldValidationNext
  }
  return result
}

const setFieldValidation = (field: string, fieldValidation: Validation) =>
  Objects.setInPath({ obj: {}, path: [keys.fields, field], value: fieldValidation })

const assocFieldValidation = (field: string, fieldValidation: Validation) => (validation: Validation) =>
  Objects.assocPath({ obj: validation, path: [keys.fields, field], value: fieldValidation })

const assocValidation = (v: Validation) => (obj: Record<string, unknown>) =>
  Objects.assoc({ obj, prop: 'validation', value: v })

const dissocValidation = (obj: Record<string, unknown>) => Objects.dissoc({ obj, prop: 'validation' })

export const Validations = {
  keys,
  hasValidation,
  getValidation,
  getFieldValidations,
  getFieldValidation,
  getErrors,
  getWarnings,
  isValid,
  isNotValid,
  isObjValid,
  getCounts,
  getErrorsCount,
  getWarningsCount,
  recalculateValidity,
  traverse,
  calculateCounts,
  calculateHasNestedErrors,
  calculateHasNestedWarnings,
  updateCounts,
  cleanup,
  mergeValidations,
  dissocFieldValidation,
  dissocFieldValidationsStartingWith,
  mergeValidation,
  mergeFieldValidations,
  assocFieldValidation,
  setFieldValidation,
  assocValidation,
  dissocValidation,
}
