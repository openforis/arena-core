import { Validation } from './validation'
import { FieldValidator } from './fieldValidator'
import { name, notKeyword, numeric, numericPositive, required } from './fieldValidators'
import { Validator } from './validator'

type ValidationTest = {
  title: string
  obj: any
  fieldsValidators: { [field: string]: Array<FieldValidator> }
  valid: boolean
}

const tests: Array<ValidationTest> = [
  // required
  {
    title: 'required field (valid)',
    obj: { a: 1, b: 2, c: null },
    fieldsValidators: { a: [required('required_field')] },
    valid: true,
  },
  {
    title: 'required field (null)',
    obj: { a: 1, b: 2, c: null },
    fieldsValidators: { c: [required('required_field')] },
    valid: false,
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
]

const validator = new Validator()

describe('Validator', () => {
  tests.forEach((query) => {
    const { title, obj, fieldsValidators, valid } = query
    test(`Validator: ${title}`, async () => {
      const validation: Validation = await validator.validate(obj, fieldsValidators)
      expect(validation).toBeDefined()
      expect(validation.valid).toBe(valid)
    })
  })
})
