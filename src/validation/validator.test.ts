import { Validation } from './validation'
import { required } from './fieldValidators'
import { FieldsValidators, Validator } from './validator'

type ValidationTest = {
  title: string
  obj: any
  propsValidators: FieldsValidators
  valid: boolean
}

const tests: Array<ValidationTest> = [
  {
    title: 'required property (valid)',
    obj: { a: 1, b: 2, c: null },
    propsValidators: { a: [required('required_field')] },
    valid: true,
  },
  {
    title: 'required property (null)',
    obj: { a: 1, b: 2, c: null },
    propsValidators: { c: [required('required_field')] },
    valid: false,
  },
]

const validator = new Validator()

tests.forEach((query) => {
  const { title, obj, propsValidators, valid } = query
  test(`Validator: ${title}`, async () => {
    const validation: Validation = await validator.validate(obj, propsValidators)
    expect(validation).toBeDefined()
    expect(validation.valid).toBe(valid)
  })
})
