import { describe, expect, test } from '@jest/globals'

import { ValidationFactory, ValidationResultFactory } from './factory'
import { Validation, ValidationSeverity } from './validation'
import { ValidationResults } from './validationResults'
import { Validations } from './validations'

// ─── helpers ────────────────────────────────────────────────────────────────

const errorResult = ValidationResultFactory.createInstance({
  valid: false,
  key: 'err_key',
  severity: ValidationSeverity.error,
})
const warningResult = ValidationResultFactory.createInstance({
  valid: false,
  key: 'warn_key',
  severity: ValidationSeverity.warning,
})

const makeValidation = (overrides?: Partial<Validation>): Validation => ValidationFactory.createInstance(overrides)

// ─── ValidationResults ──────────────────────────────────────────────────────

describe('ValidationResults', () => {
  describe('getKey', () => {
    test('returns the key of a result', () => {
      expect(ValidationResults.getKey(errorResult)).toBe('err_key')
    })

    test('returns undefined when key is absent', () => {
      const result = ValidationResultFactory.createInstance({ valid: false })
      expect(ValidationResults.getKey(result)).toBeUndefined()
    })
  })

  describe('getParams', () => {
    test('returns params when present', () => {
      const result = ValidationResultFactory.createInstance({ valid: false, params: { min: 1, max: 10 } })
      expect(ValidationResults.getParams(result)).toEqual({ min: 1, max: 10 })
    })

    test('returns undefined when params are absent', () => {
      expect(ValidationResults.getParams(errorResult)).toBeUndefined()
    })
  })

  describe('getSeverity', () => {
    test('returns error severity', () => {
      expect(ValidationResults.getSeverity(errorResult)).toBe(ValidationSeverity.error)
    })

    test('returns warning severity', () => {
      expect(ValidationResults.getSeverity(warningResult)).toBe(ValidationSeverity.warning)
    })
  })

  describe('getMessages / getMessage / hasMessages', () => {
    const resultWithMessages = ValidationResultFactory.createInstance({
      valid: false,
      messages: { en: 'Required', fr: 'Obligatoire' },
    })
    const resultNoMessages = ValidationResultFactory.createInstance({ valid: false })

    test('getMessages returns the messages map', () => {
      expect(ValidationResults.getMessages(resultWithMessages)).toEqual({ en: 'Required', fr: 'Obligatoire' })
    })

    test('getMessage returns the message for the requested language', () => {
      expect(ValidationResults.getMessage('en')(resultWithMessages)).toBe('Required')
      expect(ValidationResults.getMessage('fr')(resultWithMessages)).toBe('Obligatoire')
    })

    test('getMessage falls back to first available message for unknown language', () => {
      expect(ValidationResults.getMessage('de')(resultWithMessages)).toBe('Required')
    })

    test('hasMessages returns true when messages are present', () => {
      expect(ValidationResults.hasMessages(resultWithMessages)).toBe(true)
    })

    test('hasMessages returns false when messages are absent', () => {
      expect(ValidationResults.hasMessages(resultNoMessages)).toBe(false)
    })
  })

  describe('isError', () => {
    test('returns true for error severity', () => {
      expect(ValidationResults.isError(errorResult)).toBe(true)
    })

    test('returns false for warning severity', () => {
      expect(ValidationResults.isError(warningResult)).toBe(false)
    })

    test('returns false when no severity is set', () => {
      const result = ValidationResultFactory.createInstance({ valid: true })
      expect(ValidationResults.isError(result)).toBe(false)
    })
  })
})

// ─── Validations ─────────────────────────────────────────────────────────────

describe('Validations', () => {
  // ── getValidation / hasValidation ──────────────────────────────────────────
  describe('getValidation / hasValidation', () => {
    test('hasValidation returns true when object has a validation property', () => {
      const obj = { validation: makeValidation() }
      expect(Validations.hasValidation(obj)).toBe(true)
    })

    test('hasValidation returns false when no validation property', () => {
      expect(Validations.hasValidation({})).toBe(false)
    })

    test('getValidation returns the validation from the object', () => {
      const v = makeValidation({ valid: true })
      expect(Validations.getValidation({ validation: v })).toBe(v)
    })

    test('getValidation returns an empty valid validation when absent', () => {
      const v = Validations.getValidation({})
      expect(v.valid).toBe(true)
    })
  })

  // ── getErrors / getWarnings ────────────────────────────────────────────────
  describe('getErrors / getWarnings', () => {
    test('getErrors returns errors array', () => {
      const v = makeValidation({ errors: [errorResult], valid: false })
      expect(Validations.getErrors(v)).toEqual([errorResult])
    })

    test('getErrors returns empty array when no errors', () => {
      expect(Validations.getErrors(makeValidation())).toEqual([])
    })

    test('getWarnings returns warnings array', () => {
      const v = makeValidation({ warnings: [warningResult], valid: false })
      expect(Validations.getWarnings(v)).toEqual([warningResult])
    })

    test('getWarnings returns empty array when no warnings', () => {
      expect(Validations.getWarnings(makeValidation())).toEqual([])
    })
  })

  // ── hasErrors / hasWarnings ────────────────────────────────────────────────
  describe('hasErrors / hasWarnings', () => {
    test('hasErrors returns true when top-level errors exist', () => {
      const v = makeValidation({ errors: [errorResult], valid: false })
      expect(Validations.hasErrors(v)).toBe(true)
    })

    test('hasErrors returns true when nested field has errors', () => {
      const v = makeValidation({
        fields: { fieldA: makeValidation({ errors: [errorResult], valid: false }) },
        valid: false,
      })
      expect(Validations.hasErrors(v)).toBe(true)
    })

    test('hasErrors returns false when no errors anywhere', () => {
      expect(Validations.hasErrors(makeValidation())).toBe(false)
    })

    test('hasWarnings returns true when top-level warnings exist', () => {
      const v = makeValidation({ warnings: [warningResult], valid: false })
      expect(Validations.hasWarnings(v)).toBe(true)
    })

    test('hasWarnings returns true when nested field has warnings', () => {
      const v = makeValidation({
        fields: { fieldA: makeValidation({ warnings: [warningResult], valid: false }) },
        valid: false,
      })
      expect(Validations.hasWarnings(v)).toBe(true)
    })

    test('hasWarnings returns false when no warnings anywhere', () => {
      expect(Validations.hasWarnings(makeValidation())).toBe(false)
    })
  })

  // ── isValid / isNotValid / isObjValid ──────────────────────────────────────
  describe('isValid / isNotValid / isObjValid', () => {
    test('isValid returns true for a valid validation', () => {
      expect(Validations.isValid(makeValidation({ valid: true }))).toBe(true)
    })

    test('isValid returns false for an invalid validation', () => {
      expect(Validations.isValid(makeValidation({ errors: [errorResult], valid: false }))).toBe(false)
    })

    test('isNotValid is the inverse of isValid', () => {
      const invalid = makeValidation({ errors: [errorResult], valid: false })
      expect(Validations.isNotValid(invalid)).toBe(true)
      expect(Validations.isNotValid(makeValidation())).toBe(false)
    })

    test('isObjValid reads validation from object and checks it', () => {
      const validObj = { validation: makeValidation({ valid: true }) }
      const invalidObj = { validation: makeValidation({ errors: [errorResult], valid: false }) }
      expect(Validations.isObjValid(validObj)).toBe(true)
      expect(Validations.isObjValid(invalidObj)).toBe(false)
    })
  })

  // ── getFieldValidation / getFieldValidations / getFieldValidationsByFields ─
  describe('getFieldValidation*', () => {
    const fieldV = makeValidation({ errors: [errorResult], valid: false })
    const parent = makeValidation({ fields: { name: fieldV }, valid: false })

    test('getFieldValidations returns the fields map', () => {
      expect(Validations.getFieldValidations(parent)).toEqual({ name: fieldV })
    })

    test('getFieldValidation returns the field validation by key', () => {
      expect(Validations.getFieldValidation('name')(parent)).toEqual(fieldV)
    })

    test('getFieldValidation returns default when field is missing', () => {
      const result = Validations.getFieldValidation('missing')(parent)
      expect(result.valid).toBe(true)
    })

    test('getFieldValidation resolves dot-separated nested paths', () => {
      const deep = makeValidation({
        fields: { a: makeValidation({ fields: { b: fieldV }, valid: false }) },
        valid: false,
      })
      expect(Validations.getFieldValidation('a.b')(deep)).toEqual(fieldV)
    })

    test('getFieldValidationsByFields returns validations only for requested fields', () => {
      const v = makeValidation({ fields: { x: fieldV, y: makeValidation() }, valid: false })
      const result = Validations.getFieldValidationsByFields(['x'])(v)
      expect(result).toHaveProperty('x')
      expect(result).not.toHaveProperty('y')
    })
  })

  // ── getCounts / getErrorsCount / getWarningsCount ──────────────────────────
  describe('getCounts / getErrorsCount / getWarningsCount', () => {
    test('getErrorsCount returns 0 when counts are absent', () => {
      expect(Validations.getErrorsCount(makeValidation())).toBe(0)
    })

    test('getWarningsCount returns 0 when counts are absent', () => {
      expect(Validations.getWarningsCount(makeValidation())).toBe(0)
    })

    test('calculateCounts counts errors and warnings across nested fields', () => {
      const v = makeValidation({
        errors: [errorResult],
        fields: {
          f1: makeValidation({ warnings: [warningResult], valid: false }),
        },
        valid: false,
      })
      const counts = Validations.calculateCounts(v)
      expect(counts.errors).toBe(1)
      expect(counts.warnings).toBe(1)
    })

    test('updateCounts stores counts on the validation', () => {
      const v = makeValidation({ errors: [errorResult], valid: false })
      const updated = Validations.updateCounts(v)
      expect(updated.counts?.errors).toBe(1)
      expect(updated.counts?.warnings).toBe(0)
    })
  })

  // ── recalculateValidity ────────────────────────────────────────────────────
  describe('recalculateValidity', () => {
    test('marks validation as invalid when it has errors', () => {
      const v: Validation = { valid: true, errors: [errorResult] }
      expect(Validations.recalculateValidity(v).valid).toBe(false)
    })

    test('marks validation as valid when no errors or warnings', () => {
      expect(Validations.recalculateValidity(makeValidation({ valid: false })).valid).toBe(true)
    })

    test('marks validation as invalid when a nested field is invalid', () => {
      const v: Validation = {
        valid: true,
        fields: { f: { valid: true, errors: [errorResult] } },
      }
      expect(Validations.recalculateValidity(v).valid).toBe(false)
    })
  })

  // ── cleanup ────────────────────────────────────────────────────────────────
  describe('cleanup', () => {
    test('removes field validations that are valid', () => {
      const v = makeValidation({
        fields: {
          good: makeValidation({ valid: true }),
          bad: makeValidation({ errors: [errorResult], valid: false }),
        },
        valid: false,
      })
      const cleaned = Validations.cleanup(v)
      expect(cleaned.fields).not.toHaveProperty('good')
      expect(cleaned.fields).toHaveProperty('bad')
    })

    test('preserves the valid flag correctly after cleanup', () => {
      const v = makeValidation({
        fields: { f: makeValidation({ errors: [errorResult], valid: false }) },
        valid: false,
      })
      const cleaned = Validations.cleanup(v)
      expect(cleaned.valid).toBe(false)
    })
  })

  // ── mergeValidation ────────────────────────────────────────────────────────
  describe('mergeValidation', () => {
    test('replaces errors with the next validation errors', () => {
      const prev = makeValidation({ errors: [errorResult], valid: false })
      const next = makeValidation({ valid: true })
      const merged = Validations.mergeValidation(next)(prev)
      expect(Validations.getErrors(merged)).toHaveLength(0)
      expect(merged.valid).toBe(true)
    })

    test('keeps existing field validations when next has no fields', () => {
      const fieldV = makeValidation({ errors: [errorResult], valid: false })
      const prev = makeValidation({ fields: { f: fieldV }, valid: false })
      const merged = Validations.mergeValidation(makeValidation())(prev)
      expect(merged.fields).toHaveProperty('f')
    })

    test('removes a field validation when the next marks it as valid', () => {
      const prev = makeValidation({
        fields: { f: makeValidation({ errors: [errorResult], valid: false }) },
        valid: false,
      })
      const next = makeValidation({ fields: { f: makeValidation({ valid: true }) }, valid: true })
      const merged = Validations.mergeValidation(next)(prev)
      expect(merged.fields?.f).toBeUndefined()
    })
  })

  // ── dissocFieldValidation ─────────────────────────────────────────────────
  describe('dissocFieldValidation', () => {
    test('removes the specified field validation', () => {
      const v = makeValidation({
        fields: { a: makeValidation({ errors: [errorResult], valid: false }) },
        valid: false,
      })
      const result = Validations.dissocFieldValidation('a')(v)
      expect(result.fields?.a).toBeUndefined()
    })
  })

  // ── dissocFieldValidationsStartingWith ────────────────────────────────────
  describe('dissocFieldValidationsStartingWith', () => {
    test('removes all field validations whose key starts with the prefix', () => {
      const v = makeValidation({
        fields: {
          node_1: makeValidation({ errors: [errorResult], valid: false }),
          node_2: makeValidation({ errors: [errorResult], valid: false }),
          other: makeValidation({ errors: [errorResult], valid: false }),
        },
        valid: false,
      })
      const result = Validations.dissocFieldValidationsStartingWith('node_')(v)
      expect(result.fields).not.toHaveProperty('node_1')
      expect(result.fields).not.toHaveProperty('node_2')
      expect(result.fields).toHaveProperty('other')
    })
  })

  // ── mergeFieldValidations ─────────────────────────────────────────────────
  describe('mergeFieldValidations', () => {
    test('merges two sets of field validations', () => {
      const fieldA = makeValidation({ errors: [errorResult], valid: false })
      const fieldB = makeValidation({ warnings: [warningResult], valid: false })
      const prev = { a: fieldA }
      const next = { b: fieldB }
      const result = Validations.mergeFieldValidations(next, prev)
      expect(result).toHaveProperty('a')
      expect(result).toHaveProperty('b')
    })
  })

  // ── traverse / calculateHasNestedErrors / calculateHasNestedWarnings ──────
  describe('traverse', () => {
    test('visits every validation node including nested ones', () => {
      const visited: Validation[] = []
      const v = makeValidation({
        errors: [errorResult],
        fields: { f: makeValidation({ warnings: [warningResult], valid: false }) },
        valid: false,
      })
      Validations.traverse((node) => visited.push(node))(v)
      expect(visited).toHaveLength(2)
    })

    test('calculateHasNestedErrors returns true when any node has errors', () => {
      const v = makeValidation({
        fields: { f: makeValidation({ errors: [errorResult], valid: false }) },
        valid: false,
      })
      expect(Validations.calculateHasNestedErrors(v)).toBe(true)
    })

    test('calculateHasNestedWarnings returns true when any node has warnings', () => {
      const v = makeValidation({
        fields: { f: makeValidation({ warnings: [warningResult], valid: false }) },
        valid: false,
      })
      expect(Validations.calculateHasNestedWarnings(v)).toBe(true)
    })
  })

  // ── assocValidation / dissocValidation ────────────────────────────────────
  describe('assocValidation / dissocValidation', () => {
    test('assocValidation attaches a validation to an object', () => {
      const v = makeValidation({ valid: true })
      const obj = Validations.assocValidation(v)({})
      expect(Validations.hasValidation(obj)).toBe(true)
    })

    test('dissocValidation removes the validation from an object', () => {
      const v = makeValidation({ valid: true })
      const obj = Validations.assocValidation(v)({})
      const stripped = Validations.dissocValidation(obj as Record<string, unknown>)
      expect(Validations.hasValidation(stripped)).toBe(false)
    })
  })

  // ── setValid / setErrors / setWarnings / setFieldValidations / setFieldValidation / assocFieldValidation ──
  describe('set* / assocFieldValidation', () => {
    test('setValid sets the valid flag on any object', () => {
      const result = Validations.setValid(false)({}) as Validation
      expect(result.valid).toBe(false)
    })

    test('setErrors stores errors on any object', () => {
      const result = Validations.setErrors([errorResult])({}) as Validation
      expect(result.errors).toEqual([errorResult])
    })

    test('setWarnings stores warnings on any object', () => {
      const result = Validations.setWarnings([warningResult])({}) as Validation
      expect(result.warnings).toEqual([warningResult])
    })

    test('setFieldValidation stores a field validation by key', () => {
      const fieldV = makeValidation({ errors: [errorResult], valid: false })
      const result = Validations.setFieldValidation('x', fieldV)({}) as Validation
      expect(result.fields?.x).toEqual(fieldV)
    })

    test('setFieldValidations replaces the whole fields map', () => {
      const fields = { x: makeValidation({ errors: [errorResult], valid: false }) }
      const result = Validations.setFieldValidations(fields)({}) as Validation
      expect(result.fields).toEqual(fields)
    })

    test('assocFieldValidation stores a field validation and recalculates validity', () => {
      const fieldV = makeValidation({ errors: [errorResult], valid: false })
      const v = makeValidation({ valid: true })
      const result = Validations.assocFieldValidation('x', fieldV)(v)
      expect(result.fields?.x).toEqual(fieldV)
      expect(result.valid).toBe(false)
    })
  })
})
