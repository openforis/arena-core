import { Validation } from './validation'
import { FieldValidator, required } from './fieldValidators'
import { Validator } from './validator'

type ValidationTest = {
  title: string
  obj: any
  fieldsValidators: { [prop: string]: Array<FieldValidator> }
  valid: boolean
}

const tests: Array<ValidationTest> = [
  {
    title: 'required property (valid)',
    obj: { a: 1, b: 2, c: null },
    fieldsValidators: { a: [required('required_field')] },
    valid: true,
  },
  {
    title: 'required property (null)',
    obj: { a: 1, b: 2, c: null },
    fieldsValidators: { c: [required('required_field')] },
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
