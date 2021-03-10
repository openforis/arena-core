import { ValidationFactory } from './factory'
import { FieldValidator } from './fieldValidators'
import { Severity, Validation, ValidationResult } from './validation'

export type FieldsValidators = {
  [prop: string]: Array<FieldValidator>
}

interface ValidateOptions {
  removeValidFields: boolean
}

const defaultValidateOptions: ValidateOptions = { removeValidFields: true }

export class Validator {
  private async validateProp(obj: any, prop: string, fieldValidators: Array<FieldValidator>): Promise<Validation> {
    const validations = await Promise.all(fieldValidators.map((fieldValidator) => fieldValidator(prop, obj)))
    const errors: Array<ValidationResult> = []
    const warnings: Array<ValidationResult> = []
    validations.forEach((validationResult) => {
      if (validationResult) {
        const arr = validationResult.severity === Severity.error ? errors : warnings
        arr.push(validationResult)
      }
    })
    const valid = errors.length === 0 && warnings.length === 0
    return ValidationFactory.createInstance({ valid, errors, warnings })
  }

  async validate(
    obj: any,
    propsValidators: FieldsValidators,
    options: ValidateOptions = defaultValidateOptions
  ): Promise<Validation> {
    const fieldsValidationArray: Array<Validation> = await Promise.all(
      Object.entries(propsValidators).flatMap(async ([field, fieldValidators]) =>
        this.validateProp(obj, field, fieldValidators)
      )
    )
    const fields: { [key: string]: Validation } = {}
    let valid = true
    Object.keys(propsValidators).forEach((field, index) => {
      const fieldValidation: Validation = fieldsValidationArray[index]
      if (!options.removeValidFields || !fieldValidation.valid) {
        fields[field] = fieldValidation
        valid = false
      }
    })
    return ValidationFactory.createInstance({ valid, fields })
  }
}
