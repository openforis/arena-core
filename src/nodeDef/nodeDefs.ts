import { Numbers } from '../utils'
import {
  NodeDef,
  NodeDefExpression,
  NodeDefProps,
  NodeDefPropsWithLayout,
  NodeDefType,
  NodeDefValidations,
} from './nodeDef'
import { NodeDefTaxonProps } from './types/taxon'

const isRoot = (nodeDef: NodeDef<NodeDefType>): boolean => !nodeDef.parentUuid

const isEntity = (nodeDef: NodeDef<NodeDefType>): boolean => nodeDef.type === NodeDefType.entity

const isMultiple = (nodeDef: NodeDef<NodeDefType>): boolean => nodeDef.props.multiple || false

const isSingle = (nodeDef: NodeDef<NodeDefType>): boolean => !isMultiple(nodeDef)

const isSingleEntity = (nodeDef: NodeDef<NodeDefType>): boolean => isEntity(nodeDef) && isSingle(nodeDef)

const isAttribute = (nodeDef: NodeDef<NodeDefType>): boolean => !isEntity(nodeDef)

const isKey = (nodeDef: NodeDef<NodeDefType, NodeDefProps>): boolean => nodeDef.props.key || false

const getType = (nodeDef: NodeDef<NodeDefType>): NodeDefType => nodeDef.type

const isReadOnly = (nodeDef: NodeDef<any>): boolean => nodeDef.props.readOnly || false

const getDefaultValues = (nodeDef: NodeDef<NodeDefType>): NodeDefExpression[] =>
  nodeDef.propsAdvanced?.defaultValues || []

const isDefaultValueEvaluatedOneTime = (nodeDef: NodeDef<NodeDefType>): boolean => {
  const defaultValueEvaluatedOneTime = nodeDef.propsAdvanced?.defaultValueEvaluatedOneTime
  return defaultValueEvaluatedOneTime === undefined ? !isReadOnly(nodeDef) : defaultValueEvaluatedOneTime
}

const getApplicable = (nodeDef: NodeDef<NodeDefType>): NodeDefExpression[] => nodeDef.propsAdvanced?.applicable || []

const getTaxonomyUuid = (nodeDef: NodeDef<NodeDefType.taxon, NodeDefTaxonProps>): string | undefined =>
  nodeDef.props.taxonomyUuid

// Validations
const getValidations = (nodeDef: NodeDef<NodeDefType>): NodeDefValidations | undefined =>
  nodeDef.propsAdvanced?.validations

const isRequired = (nodeDef: NodeDef<NodeDefType>): boolean => getValidations(nodeDef)?.required || false

// // Min max
const getMinCount = (nodeDef: NodeDef<NodeDefType>) => Numbers.toNumber(getValidations(nodeDef)?.count?.min)

const getMaxCount = (nodeDef: NodeDef<NodeDefType>) => Numbers.toNumber(getValidations(nodeDef)?.count?.max)

const hasMinOrMaxCount = (nodeDef: NodeDef<NodeDefType>) =>
  !Number.isNaN(getMinCount(nodeDef)) || !Number.isNaN(getMaxCount(nodeDef))

// layout
const getLayoutRenderTypePerCycle =
  (cycle = '0') =>
  (nodeDef: NodeDef<any, NodeDefPropsWithLayout<any>>): string | undefined =>
    nodeDef?.props?.layout?.[cycle]?.renderType

export const NodeDefs = {
  isEntity,
  isMultiple,
  isSingle,
  isSingleEntity,
  isAttribute,
  isKey,
  isRoot,
  getType,
  getDefaultValues,
  isDefaultValueEvaluatedOneTime,
  getApplicable,
  getTaxonomyUuid,
  // layout
  getLayoutRenderTypePerCycle,
  // validations
  getValidations,
  isRequired,
  // // Min Max
  hasMinOrMaxCount,
  getMaxCount,
  getMinCount,
}
