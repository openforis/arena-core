import { Validation, ValidationFactory, ValidationResult, ValidationResultFactory, Validator } from '../../validation'

import { Survey } from '../../survey'
import { Record } from '../record'
import { AttributeValidator } from './attributeValidator'
import { CountValidator } from './countVaildator'
import { Node } from '../../node'

export const validateNodes = async (params: { survey: Survey; record: Record; nodes: { [key: string]: Node } }) => {
  const { survey, record, nodes } = params

  const attributeValidations = await AttributeValidator.validateSelfAndDependentAttributes({ survey, record, nodes })

  // 2. validate min/max count
  const nodeCountValidations = CountValidator.validateChildrenCountNodes({ survey, record, nodes })

  // 3. merge validations
  return Validation.recalculateValidity(
    ValidationFactory.createInstance({
      valid: true,
      fields: {
        ...attributeValidations,
        ...nodeCountValidations,
      },
    })
  )
}
