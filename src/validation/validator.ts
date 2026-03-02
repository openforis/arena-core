import { ValidationFactory } from './factory'
import { FieldValidator } from './fieldValidator'
import { ValidationSeverity, Validation, ValidationResult, ValidationFields } from './validation'

interface ValidateOptions {
  removeValid: boolean
}

const defaultValidateOptions: ValidateOptions = { removeValid: true }

export class Validator {
  private async validateField(obj: any, field: string, fieldValidators: Array<FieldValidator>): Promise<Validation> {
    const validations = await Promise.all(fieldValidators.map((fieldValidator) => fieldValidator(field, obj)))
    const errors: Array<ValidationResult> = []
    const warnings: Array<ValidationResult> = []
    for (const validationResult of validations) {
      if (!validationResult.valid) {
        const arr = validationResult.severity === ValidationSeverity.error ? errors : warnings
        arr.push(validationResult)
      }
    }
    const valid = errors.length === 0 && warnings.length === 0
    return ValidationFactory.createInstance({ valid, errors, warnings })
  }

  async validate(
    obj: any,
    fieldsValidators: { [field: string]: Array<FieldValidator> },
    options: ValidateOptions = defaultValidateOptions
  ): Promise<Validation> {
    const fieldsValidationArray: Array<Validation> = await Promise.all(
      Object.entries(fieldsValidators).flatMap(async ([field, fieldValidators]) =>
        this.validateField(obj, field, fieldValidators)
      )
    )
    const fields: ValidationFields = {}
    let valid = true
    const fieldValidatorsKeys = Object.keys(fieldsValidators)
    for (let index = 0; index < fieldValidatorsKeys.length; index++) {
      const field = fieldValidatorsKeys[index]
      const fieldValidation: Validation = fieldsValidationArray[index]
      if (!options.removeValid || !fieldValidation.valid) {
        fields[field] = fieldValidation
        valid = false
      }
    }
    return ValidationFactory.createInstance({ valid, fields })
  }
}
