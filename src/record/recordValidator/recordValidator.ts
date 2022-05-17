import * as Validation from '@core/validation/validation'

import * as CountValidator from './countValidator'
import { Survey } from '../../survey'
import { Record } from '../record'
import { AttributeValidator } from './attributeValidator'

export const validateNodes = async (params: { survey: Survey; record: Record; nodes: { [key: string]: Node } }) => {
  const { survey, record, nodes } = params

  const attributeValidations = await AttributeValidator.validateSelfAndDependentAttributes({ survey, record, nodes })

  // 2. validate min/max count
  const nodeCountValidations = CountValidator.validateChildrenCountNodes(survey, record, nodes)

  // 3. merge validations
  return Validation.recalculateValidity(
    Validation.newInstance(true, {
      ...attributeValidations,
      ...nodeCountValidations,
    })
  )
}
