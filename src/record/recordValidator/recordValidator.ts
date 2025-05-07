import { ValidationFactory } from '../../validation'
import { Validations } from '../../validation/validations'
import { AttributesValidatorParams, AttributeValidator } from './attributeValidator'
import { CountValidator } from './countVaildator'

export const validateNodes = async (params: AttributesValidatorParams) => {
  const { survey, record, nodes } = params

  const attributeValidations = await AttributeValidator.validateSelfAndDependentAttributes(params)

  // 2. validate min/max count
  const nodeCountValidations = CountValidator.validateChildrenCountNodes({ survey, record, nodes })

  // 3. merge validations
  return Validations.recalculateValidity(
    ValidationFactory.createInstance({
      valid: true,
      fields: {
        ...attributeValidations,
        ...nodeCountValidations,
      },
    })
  )
}
