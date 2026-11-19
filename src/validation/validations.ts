import { Objects } from '../utils'
import { ArenaMutationOptions } from '../utils/mutationOptions'
import { ValidationFactory } from './factory'
import { ArenaValidation, ArenaValidationCounts, ArenaValidationFields, ArenaValidationResult } from './validation'

const keys = {
  counts: 'counts',
  errors: 'errors',
  fields: 'fields',
  valid: 'valid',
  validation: 'validation',
  warnings: 'warnings',
}

const hasValidation = (obj: any): boolean => !!obj?.validation

const getValidation = (obj: any): ArenaValidation => obj?.validation || ValidationFactory.createInstance()

const getFieldValidations = (validation: ArenaValidation): ArenaValidationFields => validation?.fields ?? {}

const getFieldValidationUnsafe =
  (field: string | number) =>
  (validation: ArenaValidation): ArenaValidation | undefined => {
    if (typeof field === 'string') {
      let validationCurrent: ArenaValidation | undefined = validation
      const parts = field.split('.')
      parts.some((part) => {
        validationCurrent = getFieldValidations(validationCurrent!)[part]
        return !validationCurrent // breaks the loop if there is no field validation
      })
      return validationCurrent
    } else {
      return getFieldValidations(validation)[field]
    }
  }

const getFieldValidation =
  (field: string | number, defaultValue: ArenaValidation = ValidationFactory.createInstance()) =>
  (validation: ArenaValidation): ArenaValidation =>
    getFieldValidationUnsafe(field)(validation) ?? defaultValue

const getFieldValidationsByFields =
  (fields: (string | number)[]) =>
  (validation: ArenaValidation): ArenaValidationFields => {
    const result: ArenaValidationFields = {}
    for (const field of fields) {
      const fieldValidation = getFieldValidationUnsafe(field)(validation)
      if (fieldValidation) {
        result[String(field)] = fieldValidation
      }
    }
    return result
  }

const getErrors = (validation: ArenaValidation): ArenaValidationResult[] => validation?.errors ?? []

const getWarnings = (validation: ArenaValidation): ArenaValidationResult[] => validation?.warnings ?? []

const hasErrors = (validation: ArenaValidation): boolean => {
  const errors = getErrors(validation)
  return !Objects.isEmpty(errors) || Object.values(getFieldValidations(validation)).some(hasErrors)
}

const hasWarnings = (validation: ArenaValidation): boolean => {
  const warnings = getWarnings(validation)
  return !Objects.isEmpty(warnings) || Object.values(getFieldValidations(validation)).some(hasWarnings)
}

const isValid = (validation: ArenaValidation): boolean => Objects.isEmpty(validation) || validation.valid
const isNotValid = (validation: ArenaValidation): boolean => !isValid(validation)
const isObjValid = (obj: object): boolean => isValid(getValidation(obj))

const getCounts = (validation: ArenaValidation): ArenaValidationCounts | undefined => validation?.counts
const getErrorsCount = (validation: ArenaValidation): number => getCounts(validation)?.errors ?? 0
const getWarningsCount = (validation: ArenaValidation): number => getCounts(validation)?.warnings ?? 0

/**
 * Creates a validation object like ValidationFactory.createInstance does, but without checking again
 * if fields is empty (checking it is O(N) for objects with many properties).
 */
const _createValidation = (params: {
  valid: boolean
  fields: ArenaValidationFields
  hasFields: boolean
  errors: ArenaValidationResult[]
  warnings: ArenaValidationResult[]
}): ArenaValidation => {
  const { valid, fields, hasFields, errors, warnings } = params
  const result: ArenaValidation = { valid }
  if (errors.length > 0) result.errors = errors
  if (hasFields) result.fields = fields
  if (warnings.length > 0) result.warnings = warnings
  return result
}

const recalculateValidity = (validation: ArenaValidation): ArenaValidation => {
  let allFieldsValid = true
  let hasFields = false

  const fieldsWithValidationRecalculated: ArenaValidationFields = {}

  for (const [fieldKey, fieldValidation] of Object.entries(getFieldValidations(validation))) {
    const fieldValidationUpdated = recalculateValidity(fieldValidation)
    fieldsWithValidationRecalculated[fieldKey] = fieldValidationUpdated
    hasFields = true
    if (!fieldValidationUpdated.valid) {
      allFieldsValid = false
    }
  }
  const errors = getErrors(validation)
  const warnings = getWarnings(validation)
  // nested errors and warnings already make the recalculated field validations not valid:
  // checking only own errors and warnings is enough (hasErrors/hasWarnings would visit the whole subtree again)
  const valid = allFieldsValid && errors.length === 0 && warnings.length === 0

  return _createValidation({ valid, fields: fieldsWithValidationRecalculated, hasFields, errors, warnings })
}

const traverse = (visitor: (visitedItem: ArenaValidation) => void) => (validation: ArenaValidation) => {
  const stack: ArenaValidation[] = []
  stack.push(validation)

  while (stack.length) {
    const validationCurrent = stack.pop()!
    visitor(validationCurrent)
    // Add field validations to stack
    const validationFields = getFieldValidations(validationCurrent)
    for (const fieldValidation of Object.values(validationFields)) {
      stack.push(fieldValidation)
    }
  }
}

const calculateCounts = (validation: ArenaValidation): ArenaValidationCounts => {
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

const updateCounts = (validation: ArenaValidation): ArenaValidation => ({
  ...validation,
  counts: calculateCounts(validation),
})

const calculateHasNestedErrors = (validation: ArenaValidation): boolean => calculateCounts(validation).errors > 0
const calculateHasNestedWarnings = (validation: ArenaValidation): boolean => calculateCounts(validation).warnings > 0

const cleanup = (validation: ArenaValidation): ArenaValidation => {
  // only not valid field validations are kept
  let hasFields = false
  const fieldsCleaned: ArenaValidationFields = {}
  for (const [field, fieldValidation] of Object.entries(getFieldValidations(validation))) {
    const fieldValidationCleaned = cleanup(fieldValidation)
    if (!fieldValidationCleaned.valid) {
      fieldsCleaned[field] = fieldValidationCleaned
      hasFields = true
    }
  }
  const errors = getErrors(validation)
  const warnings = getWarnings(validation)
  // nested errors and warnings already make the cleaned field validations not valid:
  // checking only own errors and warnings is enough (hasErrors/hasWarnings would visit the whole subtree again)
  const valid = !hasFields && errors.length === 0 && warnings.length === 0

  return _createValidation({ valid, fields: fieldsCleaned, hasFields, errors, warnings })
}

/**
 * Options of the functions removing field validations.
 */
export interface ArenaDissocFieldValidationOptions extends ArenaMutationOptions {
  /**
   * When true (default), the validation is cleaned up after removing the field validations (empty field validations
   * removed and validity recalculated).
   */
  doCleanup?: boolean
}

const toDissocFieldValidationOptions = (
  options?: ArenaDissocFieldValidationOptions | boolean,
  doCleanup?: boolean
): ArenaDissocFieldValidationOptions =>
  typeof options === 'boolean' || options === undefined ? { sideEffect: options, doCleanup } : options

function dissocFieldValidation(
  fieldKey: string,
  options?: ArenaDissocFieldValidationOptions
): (validation: ArenaValidation) => ArenaValidation
/** @deprecated Pass the options object instead of the positional booleans: `{ sideEffect, doCleanup }` */
function dissocFieldValidation(
  fieldKey: string,
  sideEffect?: boolean,
  doCleanup?: boolean
): (validation: ArenaValidation) => ArenaValidation
function dissocFieldValidation(
  fieldKey: string,
  options?: ArenaDissocFieldValidationOptions | boolean,
  doCleanupParam?: boolean
): (validation: ArenaValidation) => ArenaValidation {
  const { sideEffect = false, doCleanup = true } = toDissocFieldValidationOptions(options, doCleanupParam)
  return (validation: ArenaValidation): ArenaValidation => {
    const validationUpdated = Objects.dissocPath({ obj: validation, path: ['fields', fieldKey], sideEffect })
    return doCleanup ? cleanup(validationUpdated) : validationUpdated
  }
}

function dissocFieldValidationsStartingWith(
  fieldStartsWith: string,
  options?: ArenaDissocFieldValidationOptions
): (validation: ArenaValidation) => ArenaValidation
/** @deprecated Pass the options object instead of the positional booleans: `{ sideEffect, doCleanup }` */
function dissocFieldValidationsStartingWith(
  fieldStartsWith: string,
  sideEffect?: boolean,
  doCleanup?: boolean
): (validation: ArenaValidation) => ArenaValidation
function dissocFieldValidationsStartingWith(
  fieldStartsWith: string,
  options?: ArenaDissocFieldValidationOptions | boolean,
  doCleanupParam?: boolean
): (validation: ArenaValidation) => ArenaValidation {
  const { sideEffect = false, doCleanup = true } = toDissocFieldValidationOptions(options, doCleanupParam)
  return (validation: ArenaValidation): ArenaValidation => {
    if (!validation?.fields) return validation

    const fieldsUpdated = sideEffect ? validation.fields : { ...validation.fields }
    for (const fieldKey of Object.keys(fieldsUpdated)) {
      if (fieldKey.startsWith(fieldStartsWith)) {
        delete fieldsUpdated[fieldKey]
      }
    }
    if (sideEffect) {
      if (doCleanup) {
        // keep the same validation object: only fields and validity are changed by the cleanup
        const { valid, fields } = cleanup(validation)
        validation.valid = valid
        if (fields) {
          validation.fields = fields
        } else {
          delete validation.fields
        }
      }
      return validation
    }
    const validationUpdated = { ...validation, fields: fieldsUpdated }
    return doCleanup ? cleanup(validationUpdated) : validationUpdated
  }
}

const mergeValidation =
  (validationNext: ArenaValidation, doCleanup = true) =>
  (validationPrev: ArenaValidation): ArenaValidation => {
    const validationFieldsResult: ArenaValidationFields = {
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

    const validationResult: ArenaValidation = { ...validationPrev, fields: validationFieldsResult }
    validationResult.errors = getErrors(validationNext)
    validationResult.warnings = getWarnings(validationNext)

    return doCleanup ? cleanup(validationResult) : recalculateValidity(validationResult)
  }

// same function as mergeValidation (kept for backwards compatibility)
const mergeValidations = mergeValidation

const mergeFieldValidations = (
  fieldValidationsNext: ArenaValidationFields,
  fieldValidationsPrev: ArenaValidationFields
): ArenaValidationFields => {
  const result: ArenaValidationFields = { ...fieldValidationsPrev }
  for (const [fieldKey, fieldValidationNext] of Object.entries(fieldValidationsNext)) {
    const fieldValidationPrev = fieldValidationsPrev[fieldKey]
    result[fieldKey] = fieldValidationPrev
      ? mergeValidation(fieldValidationNext, false)(fieldValidationPrev)
      : fieldValidationNext
  }
  return result
}

const setValid = (valid: boolean) => (obj: object) => Objects.setInPath({ obj, path: [keys.valid], value: valid })

const setErrors =
  (errors: ArenaValidationResult[]) =>
  <T extends object>(obj: T): T =>
    Objects.setInPath({ obj, path: [keys.errors], value: errors })

const setWarnings =
  (warnings: ArenaValidationResult[]) =>
  <T extends object>(obj: T): T =>
    Objects.setInPath({ obj, path: [keys.warnings], value: warnings })

const setFieldValidations =
  (fieldValidations: ArenaValidationFields) =>
  <T extends object>(obj: T): T =>
    Objects.setInPath({ obj, path: [keys.fields], value: fieldValidations })

const setFieldValidation =
  (field: string, fieldValidation: ArenaValidation) =>
  <T extends object>(obj: T): T =>
    Objects.setInPath({ obj, path: [keys.fields, field], value: fieldValidation })

const assocFieldValidation = (field: string, fieldValidation: ArenaValidation) => (validation: ArenaValidation) =>
  cleanup(Objects.assocPath({ obj: validation, path: [keys.fields, field], value: fieldValidation }))

const assocValidation = (v: ArenaValidation) => (obj: object) => Objects.assoc({ obj, prop: 'validation', value: v })

const dissocValidation = (obj: object) => Objects.dissoc({ obj, prop: 'validation' })

export const Validations = {
  keys,
  hasValidation,
  getValidation,
  getFieldValidation,
  getFieldValidations,
  getFieldValidationsByFields,
  getErrors,
  getWarnings,
  hasErrors,
  hasWarnings,
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
  setValid,
  setErrors,
  setWarnings,
  setFieldValidations,
  assocFieldValidation,
  setFieldValidation,
  assocValidation,
  dissocValidation,
}
