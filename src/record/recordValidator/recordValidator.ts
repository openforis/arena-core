import { Node, NodesMap } from '../../node'
import { Arrays } from '../../utils'
import { Validation, ValidationFactory } from '../../validation'
import { Validations } from '../../validation/validations'
import { Records } from '../records'
import {
  AttributesValidatorParams,
  AttributeValidator,
  RecordValidatorParams,
  SortedAttributesValidatorParams,
} from './attributeValidator'
import { CountValidator } from './countVaildator'

export const validateSortedNodes = async (params: SortedAttributesValidatorParams): Promise<Validation> => {
  const { survey, record, nodesArray } = params

  // 1. validate attributes
  const attributeValidations = await AttributeValidator.validateSelfAndDependentSortedAttributes({
    ...params,
    nodesArray,
  })

  const nodes = Arrays.toUuidIndexedObject(nodesArray)

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

export const validateNodes = async (params: AttributesValidatorParams): Promise<Validation> =>
  validateSortedNodes({ ...params, nodesArray: Object.values(params.nodes) })

export const validateRecord = async (params: RecordValidatorParams): Promise<Validation> => {
  const { record } = params
  const nodesArray: Node[] = []
  const nodes: NodesMap = {}
  Records.visitDescendantsAndSelf({
    record,
    node: Records.getRoot(record)!,
    visitor: (node) => {
      nodesArray.push(node)
      nodes[node.uuid] = node
    },
  })

  return validateSortedNodes({ ...params, nodesArray })
}
