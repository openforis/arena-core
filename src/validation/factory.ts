import { Factory } from 'src/common'
import { Validation, ValidationMessage } from './validation'

export type ValidationFactoryParams = {
  errors: Array<ValidationMessage>
  fields: {
    [name: string]: Validation
  }
  valid: boolean
  warnings: Array<ValidationMessage>
}

const defaultProps = {
  valid: true,
  errors: <ValidationMessage[]>[],
  warnings: <ValidationMessage[]>[],
}

export const ValidationFactory: Factory<Validation> = {
  createInstance: (params: ValidationFactoryParams): Validation => {
    const { errors, fields, valid, warnings } = {
      ...defaultProps,
      ...params,
    }
    return {
      errors,
      fields,
      valid,
      warnings,
    }
  },
}
