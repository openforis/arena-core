import { ValidationFactory } from './factory'
import { ArenaFieldValidator } from './fieldValidator'
import { ValidationSeverity, ArenaValidation, ArenaValidationResult, ArenaValidationFields } from './validation'

interface ValidateOptions {
  removeValid: boolean
}

const defaultValidateOptions: ValidateOptions = { removeValid: true }

export class Validator {
  private async validateField(
    obj: any,
    field: string,
    fieldValidators: Array<ArenaFieldValidator>
  ): Promise<ArenaValidation> {
    const validations = await Promise.all(fieldValidators.map((fieldValidator) => fieldValidator(field, obj)))
    const errors: Array<ArenaValidationResult> = []
    const warnings: Array<ArenaValidationResult> = []
    validations.forEach((validationResult) => {
      if (!validationResult.valid) {
        const arr = validationResult.severity === ValidationSeverity.error ? errors : warnings
        arr.push(validationResult)
      }
    })
    const valid = errors.length === 0 && warnings.length === 0
    return ValidationFactory.createInstance({ valid, errors, warnings })
  }

  async validate(
    obj: any,
    fieldsValidators: { [field: string]: Array<ArenaFieldValidator> },
    options: ValidateOptions = defaultValidateOptions
  ): Promise<ArenaValidation> {
    const fieldsValidationArray: Array<ArenaValidation> = await Promise.all(
      Object.entries(fieldsValidators).map(async ([field, fieldValidators]) =>
        this.validateField(obj, field, fieldValidators)
      )
    )
    const fields: ArenaValidationFields = {}
    let valid = true
    Object.keys(fieldsValidators).forEach((field, index) => {
      const fieldValidation: ArenaValidation = fieldsValidationArray[index]
      if (!fieldValidation.valid) {
        valid = false
      }
      if (!options.removeValid || !fieldValidation.valid) {
        fields[field] = fieldValidation
      }
    })
    return ValidationFactory.createInstance({ valid, fields })
  }
}
