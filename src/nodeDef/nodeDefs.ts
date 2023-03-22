import { LanguageCode } from '../language'
import { Numbers, Objects, Strings } from '../utils'
import {
  NodeDef,
  NodeDefExpression,
  NodeDefProps,
  NodeDefPropsWithLayout,
  NodeDefType,
  NodeDefValidations,
} from './nodeDef'
import { NodeDefDecimalProps } from './types/decimal'
import { NodeDefEntity } from './types/entity'
import { NodeDefTaxonProps } from './types/taxon'
import { NodeDefText } from './types/text'

const isRoot = (nodeDef: NodeDef<NodeDefType>): boolean => !nodeDef.parentUuid

const isAttribute = (nodeDef: NodeDef<NodeDefType>): boolean => !isEntity(nodeDef)

const isEntity = (nodeDef: NodeDef<NodeDefType>): boolean => nodeDef.type === NodeDefType.entity

const isMultiple = (nodeDef: NodeDef<NodeDefType>): boolean => nodeDef.props.multiple || false

const isSingle = (nodeDef: NodeDef<NodeDefType>): boolean => !isMultiple(nodeDef)

const isSingleEntity = (nodeDef: NodeDef<NodeDefType>): boolean => isEntity(nodeDef) && isSingle(nodeDef)

const isSingleAttribute = (nodeDef: NodeDef<NodeDefType>): boolean => isAttribute(nodeDef) && isSingle(nodeDef)

const isMultipleEntity = (nodeDef: NodeDef<NodeDefType>): boolean => isEntity(nodeDef) && isMultiple(nodeDef)

const isMultipleAttribute = (nodeDef: NodeDef<NodeDefType>): boolean => isAttribute(nodeDef) && isMultiple(nodeDef)

const isKey = (nodeDef: NodeDef<NodeDefType, NodeDefProps>): boolean => nodeDef.props.key || false

const getType = (nodeDef: NodeDef<NodeDefType>): NodeDefType => nodeDef.type

const getName = (nodeDef: NodeDef<NodeDefType, NodeDefProps>): string => nodeDef.props.name || ''

const getLabelOrName = (nodeDef: NodeDef<NodeDefType, NodeDefProps>, lang: LanguageCode): string =>
  Strings.defaultIfEmpty(getName(nodeDef))(nodeDef.props.labels?.[lang])

const isReadOnly = (nodeDef: NodeDef<any>): boolean => nodeDef.props.readOnly || false

const isEnumerate = (nodeDef: NodeDefEntity): boolean => nodeDef.props.enumerate || false

const getDefaultValues = (nodeDef: NodeDef<NodeDefType>): NodeDefExpression[] =>
  nodeDef.propsAdvanced?.defaultValues || []

const isDefaultValueEvaluatedOneTime = (nodeDef: NodeDef<NodeDefType>): boolean => {
  const defaultValueEvaluatedOneTime = nodeDef.propsAdvanced?.defaultValueEvaluatedOneTime
  return defaultValueEvaluatedOneTime === undefined ? !isReadOnly(nodeDef) : defaultValueEvaluatedOneTime
}

const getApplicable = (nodeDef: NodeDef<NodeDefType>): NodeDefExpression[] => nodeDef.propsAdvanced?.applicable || []

const getMaxNumberDecimalDigits = (nodeDef: NodeDef<NodeDefType, NodeDefDecimalProps>) => {
  const decimalDigits = nodeDef.props.maxNumberDecimalDigits
  return Objects.isEmpty(decimalDigits) ? NaN : Number(decimalDigits)
}

const getTaxonomyUuid = (nodeDef: NodeDef<NodeDefType.taxon, NodeDefTaxonProps>): string | undefined =>
  nodeDef.props.taxonomyUuid

const getTextTransform = (nodeDef: NodeDefText): string | undefined => nodeDef.props?.textTransform

// File
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
const getLayoutProps =
  (cycle = '0') =>
  (nodeDef: NodeDef<any, NodeDefPropsWithLayout<any>>): any =>
    nodeDef?.props?.layout?.[cycle] || {}

const getLayoutRenderType =
  (cycle = '0') =>
  (nodeDef: NodeDef<any, NodeDefPropsWithLayout<any>>): string | undefined =>
    getLayoutProps(cycle)(nodeDef).renderType

const isHiddenWhenNotRelevant =
  (cycle = '0') =>
  (nodeDef: NodeDef<any, NodeDefPropsWithLayout<any>>): boolean =>
    getLayoutProps(cycle)(nodeDef).hiddenWhenNotRelevant

export const NodeDefs = {
  isEntity,
  isMultiple,
  isMultipleEntity,
  isSingle,
  isSingleEntity,
  isAttribute,
  isSingleAttribute,
  isMultipleAttribute,
  isKey,
  isReadOnly,
  isEnumerate,
  isRoot,
  getType,
  getName,
  getLabelOrName,
  getDefaultValues,
  isDefaultValueEvaluatedOneTime,
  getApplicable,
  getMaxNumberDecimalDigits,
  getTaxonomyUuid,
  getTextTransform,

  // layout
  getLayoutProps,
  getLayoutRenderType,
  isHiddenWhenNotRelevant,
  // validations
  getValidations,
  isRequired,
  // // Min Max
  hasMinOrMaxCount,
  getMaxCount,
  getMinCount,
}
