import { LanguageCode } from '../language'
import { valuePropsCoordinate } from '../node/nodeValueProps'
import { Numbers, Objects, Strings } from '../utils'
import {
  NodeDef,
  NodeDefExpression,
  NodeDefLayout,
  NodeDefProps,
  NodeDefPropsWithLayout,
  NodeDefType,
  NodeDefValidations,
} from './nodeDef'
import { NodeDefCode } from './types/code'
import { NodeDefCoordinate } from './types/coordinate'
import { NodeDefDecimal } from './types/decimal'
import { NodeDefEntity, NodeDefEntityChildPosition, NodeDefEntityRenderType } from './types/entity'
import { NodeDefTaxon } from './types/taxon'
import { NodeDefText } from './types/text'

const isRoot = (nodeDef: NodeDef<NodeDefType>): boolean => !nodeDef.parentUuid

const isAttribute = (nodeDef: NodeDef<NodeDefType>): boolean => !isEntity(nodeDef)

const isEntity = (nodeDef: NodeDef<NodeDefType>): boolean => nodeDef.type === NodeDefType.entity

const isMultiple = (nodeDef: NodeDef<NodeDefType>): boolean => nodeDef.props.multiple ?? false

const isSingle = (nodeDef: NodeDef<NodeDefType>): boolean => !isMultiple(nodeDef)

const isSingleEntity = (nodeDef: NodeDef<NodeDefType>): boolean => isEntity(nodeDef) && isSingle(nodeDef)

const isSingleAttribute = (nodeDef: NodeDef<NodeDefType>): boolean => isAttribute(nodeDef) && isSingle(nodeDef)

const isMultipleEntity = (nodeDef: NodeDef<NodeDefType>): boolean => isEntity(nodeDef) && isMultiple(nodeDef)

const isMultipleAttribute = (nodeDef: NodeDef<NodeDefType>): boolean => isAttribute(nodeDef) && isMultiple(nodeDef)

const isKey = (nodeDef: NodeDef<NodeDefType, NodeDefProps>): boolean => nodeDef.props.key ?? false

const getType = (nodeDef: NodeDef<NodeDefType>): NodeDefType => nodeDef.type

const isLayoutElement = (nodeDef: NodeDef<NodeDefType>): boolean => nodeDef.type === NodeDefType.formHeader

const getName = (nodeDef: NodeDef<NodeDefType, NodeDefProps>): string => nodeDef.props.name ?? ''

const getLabelOrName = (nodeDef: NodeDef<NodeDefType, NodeDefProps>, lang: LanguageCode): string =>
  Strings.defaultIfEmpty(getName(nodeDef))(nodeDef.props.labels?.[lang])

const getDescription = (nodeDef: NodeDef<NodeDefType, NodeDefProps>, lang: LanguageCode): string =>
  Strings.defaultIfEmpty(getName(nodeDef))(nodeDef.props.descriptions?.[lang])

const isReadOnly = (nodeDef: NodeDef<any>): boolean => nodeDef.props.readOnly ?? false

const isHidden = (nodeDef: NodeDef<any>): boolean => nodeDef.props.hidden ?? false

const isEnumerate = (nodeDef: NodeDefEntity): boolean => nodeDef.props.enumerate ?? false

const getDefaultValues = (nodeDef: NodeDef<NodeDefType>): NodeDefExpression[] =>
  nodeDef.propsAdvanced?.defaultValues ?? []

const isDefaultValueEvaluatedOneTime = (nodeDef: NodeDef<NodeDefType>): boolean =>
  !!nodeDef.propsAdvanced?.defaultValueEvaluatedOneTime

const getApplicable = (nodeDef: NodeDef<NodeDefType>): NodeDefExpression[] => nodeDef.propsAdvanced?.applicable ?? []

const getVisibleFields = (nodeDef: NodeDef<NodeDefType>): string[] | undefined => nodeDef.props.visibleFields

const isFieldVisible = (field: string) => (nodeDef: NodeDef<any>) => {
  const visibleFields = getVisibleFields(nodeDef)
  return !visibleFields || visibleFields.includes(field)
}

const isInCycle =
  (cycle: string) =>
  (nodeDef: NodeDef<NodeDefType>): boolean =>
    !!nodeDef.props.cycles?.includes(cycle)

// code
const getCategoryUuid = (nodeDef: NodeDefCode): string | undefined => nodeDef.props.categoryUuid
const getParentCodeDefUuid = (nodeDef: NodeDefCode): string | undefined => nodeDef.props.parentCodeDefUuid

// coordinate
const isAllowOnlyDeviceCoordinate = (nodeDef: NodeDefCoordinate): boolean => !!nodeDef.props.allowOnlyDeviceCoordinate

const getCoordinateAdditionalFields = (nodeDef: NodeDefCoordinate): string[] => {
  const result = []
  if (nodeDef.props.includeAccuracy) result.push(valuePropsCoordinate[valuePropsCoordinate.accuracy])
  if (nodeDef.props.includeAltitude) result.push(valuePropsCoordinate[valuePropsCoordinate.altitude])
  if (nodeDef.props.includeAltitudeAccuracy) result.push(valuePropsCoordinate[valuePropsCoordinate.altitudeAccuracy])
  return result
}

// decimal
const getMaxNumberDecimalDigits = (nodeDef: NodeDefDecimal) => {
  const decimalDigits = nodeDef.props.maxNumberDecimalDigits
  return Objects.isEmpty(decimalDigits) ? NaN : Number(decimalDigits)
}

// taxon
const getTaxonomyUuid = (nodeDef: NodeDefTaxon): string | undefined => nodeDef.props.taxonomyUuid

// text
const getTextTransform = (nodeDef: NodeDefText): string | undefined => nodeDef.props?.textTransform

// code and taxon
const getItemsFilter = (nodeDef: NodeDef<any>): string | undefined => nodeDef.propsAdvanced?.itemsFilter

// Validations
const getValidations = (nodeDef: NodeDef<NodeDefType>): NodeDefValidations | undefined =>
  nodeDef.propsAdvanced?.validations

const getValidationsExpressions = (nodeDef: NodeDef<NodeDefType>): NodeDefExpression[] =>
  getValidations(nodeDef)?.expressions ?? []

const isRequired = (nodeDef: NodeDef<NodeDefType>): boolean => getValidations(nodeDef)?.required ?? false

// // Min max
const getMinCount = (nodeDef: NodeDef<NodeDefType>): string | undefined => getValidations(nodeDef)?.count?.min

const getMaxCount = (nodeDef: NodeDef<NodeDefType>): string | undefined => getValidations(nodeDef)?.count?.max

const hasMinOrMaxCount = (nodeDef: NodeDef<NodeDefType>) =>
  !Number.isNaN(getMinCount(nodeDef)) || !Number.isNaN(getMaxCount(nodeDef))

// layout
const getLayoutProps =
  (cycle = '0') =>
  (nodeDef: NodeDef<any, NodeDefPropsWithLayout<any>>): any =>
    nodeDef?.props?.layout?.[cycle] ?? {}

const getLayoutRenderType =
  (cycle = '0') =>
  (nodeDef: NodeDef<any, NodeDefPropsWithLayout<any>>): string | undefined =>
    getLayoutProps(cycle)(nodeDef).renderType

const isLayoutRenderTypeForm =
  (cycle = '0') =>
  (nodeDef: NodeDefEntity): boolean =>
    getLayoutRenderType(cycle)(nodeDef) === NodeDefEntityRenderType.form

const isLayoutRenderTypeTable =
  (cycle = '0') =>
  (nodeDef: NodeDefEntity): boolean =>
    getLayoutRenderType(cycle)(nodeDef) === NodeDefEntityRenderType.table

const getChildrenEntitiesInOwnPageUudis =
  (cycle = '0') =>
  (nodeDef: NodeDefEntity): string[] =>
    getLayoutProps(cycle)(nodeDef).indexChildren

const getLayoutChildren =
  (cycle = '0') =>
  (nodeDef: NodeDefEntity): NodeDefEntityChildPosition[] | string[] | undefined =>
    getLayoutProps(cycle)(nodeDef).layoutChildren

const isHiddenInMobile =
  (cycle = '0') =>
  <L extends NodeDefLayout>(nodeDef: NodeDef<any, NodeDefPropsWithLayout<L>>): boolean =>
    getLayoutProps(cycle)(nodeDef).hiddenInMobile ?? false

const isIncludedInMultipleEntitySummary =
  (cycle = '0') =>
  <L extends NodeDefLayout>(nodeDef: NodeDef<any, NodeDefPropsWithLayout<L>>): boolean =>
    getLayoutProps(cycle)(nodeDef).includedInMultipleEntitySummary ?? false

const isHiddenWhenNotRelevant =
  (cycle = '0') =>
  <L extends NodeDefLayout>(nodeDef: NodeDef<any, NodeDefPropsWithLayout<L>>): boolean =>
    getLayoutProps(cycle)(nodeDef).hiddenWhenNotRelevant ?? false

const isCodeShown =
  (cycle = '0') =>
  (nodeDef: NodeDefCode): boolean =>
    getLayoutProps(cycle)(nodeDef).codeShown ?? false

// Analysis
const getAreaBasedEstimatedOf = (nodeDef: NodeDef<any>): string | undefined =>
  nodeDef.propsAdvancedDraft?.areaBasedEstimatedOf ?? nodeDef.propsAdvanced?.areaBasedEstimatedOf

const getIndexInChain = (nodeDef: NodeDef<any>): number | undefined => nodeDef.propsAdvanced?.index

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
  isHidden,
  isEnumerate,
  isRoot,
  getType,
  isLayoutElement,
  getName,
  getLabelOrName,
  getDescription,
  getDefaultValues,
  isDefaultValueEvaluatedOneTime,
  getApplicable,
  getVisibleFields,
  isFieldVisible,
  isInCycle,
  getCategoryUuid,
  getParentCodeDefUuid,
  isAllowOnlyDeviceCoordinate,
  getCoordinateAdditionalFields,
  getMaxNumberDecimalDigits,
  getTaxonomyUuid,
  getTextTransform,
  getItemsFilter,

  // layout
  getLayoutProps,
  getLayoutRenderType,
  isLayoutRenderTypeForm,
  isLayoutRenderTypeTable,
  getChildrenEntitiesInOwnPageUudis,
  getLayoutChildren,
  isHiddenInMobile,
  isIncludedInMultipleEntitySummary,
  isHiddenWhenNotRelevant,
  isCodeShown,
  // validations
  getValidations,
  getValidationsExpressions,
  isRequired,
  // // Min Max
  hasMinOrMaxCount,
  getMaxCount,
  getMinCount,
  // Analysis
  getAreaBasedEstimatedOf,
  getIndexInChain,
}
