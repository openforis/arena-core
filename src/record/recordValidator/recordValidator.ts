import { ArenaRecordNode } from '../../node'
import { ArenaValidation, ValidationFactory } from '../../validation'
import { Validations } from '../../validation/validations'
import { Records } from '../records'
import {
  ArenaAttributesValidatorParams,
  AttributeValidator,
  ArenaRecordValidatorParams,
  ArenaSortedAttributesValidatorParams,
} from './attributeValidator'
import { CountValidator } from './countValidator'

export const validateSortedNodes = async (params: ArenaSortedAttributesValidatorParams): Promise<ArenaValidation> => {
  const { survey, record, nodesArray } = params

  // 1. validate attributes
  const attributeValidations = await AttributeValidator.validateSelfAndDependentSortedAttributes({
    ...params,
    nodesArray,
  })

  // 2. validate min/max count
  const nodeCountValidations = CountValidator.validateChildrenCountNodesArray({ survey, record, nodesArray })

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

export const validateNodes = async (params: ArenaAttributesValidatorParams): Promise<ArenaValidation> =>
  validateSortedNodes({ ...params, nodesArray: Object.values(params.nodes) })

export const validateRecord = async (params: ArenaRecordValidatorParams): Promise<ArenaValidation> => {
  const { record } = params
  const nodesArray: ArenaRecordNode[] = []
  Records.visitDescendantsAndSelf(Records.getRoot(record)!, (node) => {
    nodesArray.push(node)
  })(record)

  return validateSortedNodes({ ...params, nodesArray })
}
