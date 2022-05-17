import { Numbers } from '../../utils'
import { NodeDef, NodeDefExpression, NodeDefProps, NodeDefType, NodeDefValidations } from '../nodeDef'
import { NodeDefTaxonProps } from '../types/taxon'

const isRoot = (nodeDef: NodeDef<NodeDefType>): boolean => !nodeDef.parentUuid

const isEntity = (nodeDef: NodeDef<NodeDefType>): boolean => nodeDef.type === NodeDefType.entity

const isSingleEntity = (nodeDef: NodeDef<NodeDefType>): boolean => isEntity(nodeDef) && !nodeDef.props.multiple

const isAttribute = (nodeDef: NodeDef<NodeDefType>): boolean => !isEntity(nodeDef)

const isKey = (nodeDef: NodeDef<NodeDefType, NodeDefProps>): boolean => nodeDef.props.key || false

const getType = (nodeDef: NodeDef<NodeDefType>): NodeDefType => nodeDef.type

const getDefaultValues = (nodeDef: NodeDef<NodeDefType>): NodeDefExpression[] =>
  nodeDef.propsAdvanced?.defaultValues || []

const getApplicable = (nodeDef: NodeDef<NodeDefType>): NodeDefExpression[] => nodeDef.propsAdvanced?.applicable || []

const getTaxonomyUuid = (nodeDef: NodeDef<NodeDefType.taxon, NodeDefTaxonProps>): string | undefined =>
  nodeDef.props.taxonomyUuid

const getValidations = (nodeDef: NodeDef<NodeDefType>): NodeDefValidations | undefined =>
  nodeDef.propsAdvanced?.validations

const isRequired = (nodeDef: NodeDef<NodeDefType>): boolean => getValidations(nodeDef)?.required || false

const hasMinOrMaxCount = (nodeDef: NodeDef<NodeDefType>) => {
  const validations = getValidations(nodeDef)
  const minCount = Numbers.toNumber(validations?.min)
  const maxCount = Numbers.toNumber(validations?.max)
  return !Number.isNaN(minCount) || !Number.isNaN(maxCount)
}

export const NodeDefs = {
  isEntity,
  isSingleEntity,
  isAttribute,
  isKey,
  isRoot,
  getType,
  getDefaultValues,
  getApplicable,
  getTaxonomyUuid,
  // validations
  getValidations,
  isRequired,
  hasMinOrMaxCount,
}
