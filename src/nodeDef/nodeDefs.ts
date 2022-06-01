import { Numbers } from '../utils'
import { NodeDef, NodeDefExpression, NodeDefProps, NodeDefType, NodeDefValidations } from './nodeDef'
import { NodeDefTaxonProps } from './types/taxon'

const isRoot = (nodeDef: NodeDef<NodeDefType>): boolean => !nodeDef.parentUuid

const isEntity = (nodeDef: NodeDef<NodeDefType>): boolean => nodeDef.type === NodeDefType.entity

const isSingle = (nodeDef: NodeDef<NodeDefType>): boolean => !nodeDef.props.multiple

const isSingleEntity = (nodeDef: NodeDef<NodeDefType>): boolean => isEntity(nodeDef) && isSingle(nodeDef)

const isAttribute = (nodeDef: NodeDef<NodeDefType>): boolean => !isEntity(nodeDef)

const isKey = (nodeDef: NodeDef<NodeDefType, NodeDefProps>): boolean => nodeDef.props.key || false

const getType = (nodeDef: NodeDef<NodeDefType>): NodeDefType => nodeDef.type

const getDefaultValues = (nodeDef: NodeDef<NodeDefType>): NodeDefExpression[] =>
  nodeDef.propsAdvanced?.defaultValues || []

const getApplicable = (nodeDef: NodeDef<NodeDefType>): NodeDefExpression[] => nodeDef.propsAdvanced?.applicable || []

const getTaxonomyUuid = (nodeDef: NodeDef<NodeDefType.taxon, NodeDefTaxonProps>): string | undefined =>
  nodeDef.props.taxonomyUuid

// Validations
const getValidations = (nodeDef: NodeDef<NodeDefType>): NodeDefValidations | undefined =>
  nodeDef.propsAdvanced?.validations

const isRequired = (nodeDef: NodeDef<NodeDefType>): boolean => getValidations(nodeDef)?.required || false

// // Min max
const getMinCount = (nodeDef: NodeDef<NodeDefType>) => Numbers.toNumber(getValidations(nodeDef)?.min)

const getMaxCount = (nodeDef: NodeDef<NodeDefType>) => Numbers.toNumber(getValidations(nodeDef)?.max)

const hasMinOrMaxCount = (nodeDef: NodeDef<NodeDefType>) =>
  !Number.isNaN(getMinCount(nodeDef)) || !Number.isNaN(getMaxCount(nodeDef))

export const NodeDefs = {
  isEntity,
  isSingle,
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
  // // Min Max
  hasMinOrMaxCount,
  getMaxCount,
  getMinCount,
}
