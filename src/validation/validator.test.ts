import { Objects } from '../utils'
import { FieldValidator } from './fieldValidator'
import { FieldValidators } from './fieldValidators'
import { Validation, ValidationResult, ValidationSeverity } from './validation'
import { ValidationResultFactory } from './factory'
import { Validator } from './validator'

const { name, notKeyword, numeric, numericPositive, required } = FieldValidators

type ValidationTest = {
  title: string
  obj: any
  fieldsValidators: { [field: string]: Array<FieldValidator> }
  valid: boolean
  errorsCountByField?: { [field: string]: number }
  warningsCountByField?: { [field: string]: number }
}

const greaterThan10 = (severity: ValidationSeverity) => (field: string, obj: any): ValidationResult => {
  const value = Objects.path(field)(obj)
  return value <= 10
    ? ValidationResultFactory.createInstance({ messageKey: 'less_or_equal_to_10', severity })
    : <ValidationResult>(<unknown>null)
}

const tests: Array<ValidationTest> = [
  // required
  {
    title: 'required field (valid)',
    obj: { a: 1, b: 2, c: null },
    fieldsValidators: { a: [required('required_field')] },
    valid: true,
    errorsCountByField: { a: 0 },
    warningsCountByField: { a: 0 },
  },
  {
    title: 'required field (null)',
    obj: { a: 1, b: 2, c: null },
    fieldsValidators: { c: [required('required_field')] },
    valid: false,
    errorsCountByField: { a: 0, b: 0, c: 1 },
  },
  // number
  {
    title: 'number field (valid)',
    obj: { a: 1, b: 2.14, c: -3, d: -4.12, e: '1' },
    fieldsValidators: {
      a: [numeric('invalid_number')],
      b: [numeric('invalid_number')],
      c: [numeric('invalid_number')],
      d: [numeric('invalid_number')],
      e: [numeric('invalid_number')],
    },
    valid: true,
  },
  {
    title: 'number field (not valid)',
    obj: { a: 'a' },
    fieldsValidators: { a: [numeric('invalid_number')] },
    valid: false,
  },
  // positive number
  {
    title: 'positive number field (valid)',
    obj: { a: 1, b: 0 },
    fieldsValidators: {
      a: [numericPositive('invalid_positive_number')],
      b: [numericPositive('invalid_positive_number')],
    },
    valid: true,
  },
  {
    title: 'positive number field (not valid - integer)',
    obj: { a: -1 },
    fieldsValidators: { a: [numericPositive('invalid_positive_number')] },
    valid: false,
  },
  {
    title: 'positive number field (not valid - decimal)',
    obj: { a: -0.1 },
    fieldsValidators: { a: [numericPositive('invalid_positive_number')] },
    valid: false,
  },
  // name
  {
    title: 'name (valid)',
    obj: { a: 'valid_name' },
    fieldsValidators: { a: [name('invalid_name')] },
    valid: true,
  },
  {
    title: 'name (not valid - uppercase letter)',
    obj: { a: 'Not_valid_name' },
    fieldsValidators: { a: [name('invalid_name')] },
    valid: false,
  },
  {
    title: 'name (not valid - starting with number)',
    obj: { a: '1_not_valid_name' },
    fieldsValidators: { a: [name('invalid_name')] },
    valid: false,
  },
  {
    title: 'name (not valid - too long)',
    obj: { a: 'abcde678901234567890123456789012345678901' },
    fieldsValidators: { a: [name('invalid_name')] },
    valid: false,
  },
  // keyword
  {
    title: 'keyword (valid)',
    obj: { a: 'valid_word' },
    fieldsValidators: { a: [notKeyword('keywords_cannot_be_used')] },
    valid: true,
  },
  {
    title: 'keyword (not valid)',
    obj: { a: 'uuid' },
    fieldsValidators: { a: [notKeyword('keywords_cannot_be_used')] },
    valid: false,
  },
  // custom
  {
    title: 'custom (valid)',
    obj: { a: 20 },
    fieldsValidators: { a: [greaterThan10(ValidationSeverity.error)] },
    valid: true,
  },
  {
    title: 'custom (not valid)',
    obj: { a: 9, b: 8 },
    fieldsValidators: { a: [greaterThan10(ValidationSeverity.error)], b: [greaterThan10(ValidationSeverity.warning)] },
    valid: false,
    errorsCountByField: { a: 1, b: 0 },
    warningsCountByField: { a: 0, b: 1 },
  },
]

const validator = new Validator()

describe('Validator', () => {
  tests.forEach((query) => {
    const { title, obj, fieldsValidators, valid, errorsCountByField, warningsCountByField } = query
    test(`Validator: ${title}`, async () => {
      const validation: Validation = await validator.validate(obj, fieldsValidators)
      expect(validation).toBeDefined()
      expect(validation.valid).toBe(valid)
      if (errorsCountByField) {
        Object.entries(errorsCountByField).forEach(([field, errorsCount]) => {
          const fieldErrorsCount = validation?.fields?.[field]?.errors?.length || 0
          expect(fieldErrorsCount).toBe(errorsCount)
        })
      }
      if (warningsCountByField) {
        Object.entries(warningsCountByField).forEach(([field, count]) => {
          const fieldWarningsCount = validation?.fields?.[field]?.warnings?.length || 0
          expect(fieldWarningsCount).toBe(count)
        })
      }
    })
  })
})
