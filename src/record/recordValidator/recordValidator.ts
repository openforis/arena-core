import { User } from '../../auth'
import { Node } from '../../node'
import { Survey } from '../../survey'
import { ValidationFactory } from '../../validation'
import { Validations } from '../../validation/validations'
import { Record } from '../record'
import { AttributeValidator } from './attributeValidator'
import { CountValidator } from './countVaildator'

export const validateNodes = async (params: {
  user: User
  survey: Survey
  record: Record
  nodes: { [key: string]: Node }
}) => {
  const { user, survey, record, nodes } = params

  const attributeValidations = await AttributeValidator.validateSelfAndDependentAttributes({
    user,
    survey,
    record,
    nodes,
  })

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
