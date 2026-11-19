import { LanguageCode } from '../language'
import { getLabelOrDefault } from '../language/labels'
import { ValuePropsCoordinate } from '../node/nodeValueProps'
import { defaultCycle } from '../survey'
import { Objects } from '../utils'
import {
  ArenaNodeDef,
  ArenaNodeDefCountExpression,
  NodeDefCountType,
  ArenaNodeDefExpression,
  ArenaNodeDefLayout,
  ArenaNodeDefProps,
  ArenaNodeDefPropsWithLayout,
  NodeDefType,
  ArenaNodeDefValidations,
} from './nodeDef'
import { ArenaNodeDefBoolean } from './types/boolean'
import { ArenaNodeDefCode } from './types/code'
import { ArenaNodeDefCoordinate } from './types/coordinate'
import { ArenaNodeDefDate } from './types/date'
import { ArenaNodeDefDecimal } from './types/decimal'
import {
  ArenaNodeDefEntity,
  ArenaNodeDefEntityLayout,
  ArenaNodeDefEntityLayoutChildItem,
  NodeDefEntityRenderType,
  ArenaNodeDefPrintOrientation,
} from './types/entity'
import { ArenaNodeDefFile, NodeDefFileType } from './types/file'
import { ArenaNodeDefFormHeader } from './types/formHeader'
import { ArenaNodeDefGeo } from './types/geo'
import { ArenaNodeDefInteger } from './types/integer'
import { ArenaNodeDefTaxon } from './types/taxon'
import { ArenaNodeDefText, NodeDefTextRenderType, NodeDefTextInputType } from './types/text'
import { ArenaNodeDefTime } from './types/time'

const isRoot = (nodeDef: ArenaNodeDef<NodeDefType>): boolean => !nodeDef.parentUuid

const isAttribute = (nodeDef: ArenaNodeDef<NodeDefType>): boolean => !isEntity(nodeDef)

const isEntity = (nodeDef: ArenaNodeDef<NodeDefType>): nodeDef is ArenaNodeDefEntity =>
  nodeDef.type === NodeDefType.entity

const isBoolean = (nodeDef: ArenaNodeDef<NodeDefType>): nodeDef is ArenaNodeDefBoolean =>
  nodeDef.type === NodeDefType.boolean

const isCode = (nodeDef: ArenaNodeDef<NodeDefType>): nodeDef is ArenaNodeDefCode => nodeDef.type === NodeDefType.code

const isCoordinate = (nodeDef: ArenaNodeDef<NodeDefType>): nodeDef is ArenaNodeDefCoordinate =>
  nodeDef.type === NodeDefType.coordinate

const isDate = (nodeDef: ArenaNodeDef<NodeDefType>): nodeDef is ArenaNodeDefDate => nodeDef.type === NodeDefType.date

const isDecimal = (nodeDef: ArenaNodeDef<NodeDefType>): nodeDef is ArenaNodeDefDecimal =>
  nodeDef.type === NodeDefType.decimal

const isFile = (nodeDef: ArenaNodeDef<NodeDefType>): nodeDef is ArenaNodeDefFile => nodeDef.type === NodeDefType.file

const isGeo = (nodeDef: ArenaNodeDef<NodeDefType>): nodeDef is ArenaNodeDefGeo => nodeDef.type === NodeDefType.geo

const isInteger = (nodeDef: ArenaNodeDef<NodeDefType>): nodeDef is ArenaNodeDefInteger =>
  nodeDef.type === NodeDefType.integer

const isTaxon = (nodeDef: ArenaNodeDef<NodeDefType>): nodeDef is ArenaNodeDefTaxon => nodeDef.type === NodeDefType.taxon

const isText = (nodeDef: ArenaNodeDef<NodeDefType>): nodeDef is ArenaNodeDefText => nodeDef.type === NodeDefType.text

const isTime = (nodeDef: ArenaNodeDef<NodeDefType>): nodeDef is ArenaNodeDefTime => nodeDef.type === NodeDefType.time

const isMultiple = (nodeDef: ArenaNodeDef<NodeDefType>): boolean => nodeDef.props.multiple ?? false

const isSingle = (nodeDef: ArenaNodeDef<NodeDefType>): boolean => !isMultiple(nodeDef)

const isSingleEntity = (nodeDef: ArenaNodeDef<NodeDefType>): nodeDef is ArenaNodeDefEntity =>
  isEntity(nodeDef) && isSingle(nodeDef)

const isSingleAttribute = (nodeDef: ArenaNodeDef<NodeDefType>): boolean => isAttribute(nodeDef) && isSingle(nodeDef)

const isMultipleEntity = (nodeDef: ArenaNodeDef<NodeDefType>): nodeDef is ArenaNodeDefEntity =>
  isEntity(nodeDef) && isMultiple(nodeDef)

const isMultipleAttribute = (nodeDef: ArenaNodeDef<NodeDefType>): boolean => isAttribute(nodeDef) && isMultiple(nodeDef)

const isKey = (nodeDef: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>): boolean => nodeDef.props.key ?? false

const isAutoIncrementalKey = (nodeDef: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>): boolean =>
  nodeDef.props.autoIncrementalKey ?? false

const isAnalysis = (nodeDef: ArenaNodeDef<NodeDefType>): boolean => nodeDef.analysis ?? false

const getType = (nodeDef: ArenaNodeDef<NodeDefType>): NodeDefType => nodeDef.type

const isLayoutElement = (nodeDef: ArenaNodeDef<NodeDefType>): nodeDef is ArenaNodeDefFormHeader =>
  nodeDef.type === NodeDefType.formHeader

const getName = (nodeDef: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>): string => nodeDef.props.name ?? ''

const getLabelOrName = (nodeDef: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>, lang: LanguageCode): string =>
  getLabelOrDefault(nodeDef.props.labels, lang, getName(nodeDef))

const getDescription = (nodeDef: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>, lang: LanguageCode): string =>
  getLabelOrDefault(nodeDef.props.descriptions, lang)

const isQualifier = (nodeDef: ArenaNodeDef<NodeDefType>): boolean => nodeDef.props.qualifier ?? false

const isReadOnly = (nodeDef: ArenaNodeDef<any>): boolean => nodeDef.props.readOnly ?? false

const isHidden = (nodeDef: ArenaNodeDef<any>): boolean => nodeDef.props.hidden ?? false

const isEnumerate = (nodeDef: ArenaNodeDefEntity): boolean => nodeDef.props.enumerate ?? false

const getEnumeratingItemsExpression = (nodeDef: ArenaNodeDefEntity): string | undefined =>
  nodeDef.propsAdvanced?.enumeratingItemsExpression

const isAutoCreateMinCountItems = (nodeDef: ArenaNodeDefEntity): boolean =>
  isMultipleEntity(nodeDef) && (nodeDef.props.autoCreateMinCountItems ?? false)

const getPrintOrientation = (nodeDef: ArenaNodeDefEntity): ArenaNodeDefPrintOrientation | undefined =>
  nodeDef.props.printOrientation

const getDefaultValues = (nodeDef: ArenaNodeDef<NodeDefType>): ArenaNodeDefExpression[] =>
  nodeDef.propsAdvanced?.defaultValues ?? []

const isDefaultValueEvaluatedOneTime = (nodeDef: ArenaNodeDef<NodeDefType>): boolean =>
  !!nodeDef.propsAdvanced?.defaultValueEvaluatedOneTime

const getApplicable = (nodeDef: ArenaNodeDef<NodeDefType>): ArenaNodeDefExpression[] =>
  nodeDef.propsAdvanced?.applicable ?? []

const getVisibleFields = (nodeDef: ArenaNodeDef<NodeDefType>): string[] | undefined => nodeDef.props.visibleFields

const isFieldVisible = (field: string) => (nodeDef: ArenaNodeDef<any>) => {
  const visibleFields = getVisibleFields(nodeDef)
  return !visibleFields || visibleFields.includes(field)
}

const isInCycle =
  (cycle: string) =>
  (nodeDef: ArenaNodeDef<NodeDefType>): boolean => {
    const cycles = nodeDef.props.cycles ?? [defaultCycle]
    return cycles.includes(cycle)
  }

const isExcludedInClone = (nodeDef: ArenaNodeDef<NodeDefType>): boolean => !!nodeDef.propsAdvanced?.excludedInClone

const getEditableIf = (nodeDef: ArenaNodeDef<NodeDefType>): ArenaNodeDefExpression[] =>
  nodeDef.propsAdvanced?.editableIf ?? []

const isAlwaysEditable = (nodeDef: ArenaNodeDef<NodeDefType>): boolean => getEditableIf(nodeDef).length === 0

const getVisibleIf = (nodeDef: ArenaNodeDef<NodeDefType>): ArenaNodeDefExpression[] =>
  nodeDef.propsAdvanced?.visibleIf ?? []

const isAlwaysVisible = (nodeDef: ArenaNodeDef<NodeDefType>): boolean => getVisibleIf(nodeDef).length === 0

// code
const getCategoryUuid = (nodeDef: ArenaNodeDefCode): string | undefined => nodeDef.props.categoryUuid
const getParentCodeDefUuid = (nodeDef: ArenaNodeDefCode): string | undefined => nodeDef.props.parentCodeDefUuid

// coordinate
const isAllowOnlyDeviceCoordinate = (nodeDef: ArenaNodeDefCoordinate): boolean =>
  !!nodeDef.props.allowOnlyDeviceCoordinate

const getCoordinateAdditionalFields = (nodeDef: ArenaNodeDefCoordinate): string[] => {
  const result = []
  if (nodeDef.props.includeAccuracy) result.push(ValuePropsCoordinate[ValuePropsCoordinate.accuracy])
  if (nodeDef.props.includeAltitude) result.push(ValuePropsCoordinate[ValuePropsCoordinate.altitude])
  if (nodeDef.props.includeAltitudeAccuracy) result.push(ValuePropsCoordinate[ValuePropsCoordinate.altitudeAccuracy])
  return result
}

// decimal
const getMaxNumberDecimalDigits = (nodeDef: ArenaNodeDefDecimal) => {
  const decimalDigits = nodeDef.props.maxNumberDecimalDigits
  return Objects.isEmpty(decimalDigits) ? Number.NaN : Number(decimalDigits)
}

// file
const getFileType = (nodeDef: ArenaNodeDefFile): NodeDefFileType | undefined => nodeDef.props.fileType
const getFileNameExpression = (nodeDef: ArenaNodeDefFile): string | undefined =>
  nodeDef.propsAdvanced?.fileNameExpression
const getFileMaxSize = (nodeDef: ArenaNodeDefFile): number | undefined => nodeDef.props.maxFileSize
const isGeotagInformationShown = (nodeDef: ArenaNodeDefFile): boolean => !!nodeDef.props.geotagInformationShown
const isScreenCaptureInMapAllowed = (nodeDef: ArenaNodeDefFile): boolean => !!nodeDef.props.screenCaptureInMapAllowed

// geo
const isPositionTracking = (nodeDef: ArenaNodeDefGeo): boolean => !!nodeDef.props.positionTracking

// time
const isSecondsIncluded = (nodeDef: ArenaNodeDefTime): boolean => !!nodeDef.props.includeSeconds

// taxon
const getTaxonomyUuid = (nodeDef: ArenaNodeDefTaxon): string | undefined => nodeDef.props.taxonomyUuid

const isVernacularNameSelectionKept = (nodeDef: ArenaNodeDefTaxon): boolean =>
  !!nodeDef.props.vernacularNameSelectionKept

const isVernacularNameAlwaysIncludedIfSingle = (nodeDef: ArenaNodeDefTaxon): boolean =>
  !!nodeDef.props.vernacularNameAlwaysIncludedIfSingle

// text
const getTextTransform = (nodeDef: ArenaNodeDefText): string | undefined => nodeDef.props?.textTransform
const getTextInputType = (nodeDef: ArenaNodeDefText): NodeDefTextInputType | undefined => nodeDef.props?.textInputType

// code and taxon
const getItemsFilter = (nodeDef: ArenaNodeDef<any>): string | undefined => nodeDef.propsAdvanced?.itemsFilter

// Validations
const getValidations = (nodeDef: ArenaNodeDef<NodeDefType>): ArenaNodeDefValidations | undefined =>
  nodeDef.propsAdvanced?.validations

const getValidationsExpressions = (nodeDef: ArenaNodeDef<NodeDefType>): ArenaNodeDefExpression[] =>
  getValidations(nodeDef)?.expressions ?? []

const isRequired = (nodeDef: ArenaNodeDef<NodeDefType>): boolean => getValidations(nodeDef)?.required ?? false

const getRequiredIf = (nodeDef: ArenaNodeDef<NodeDefType>): ArenaNodeDefExpression[] =>
  getValidations(nodeDef)?.requiredIf ?? []

const isRequiredIfDefined = (nodeDef: ArenaNodeDef<NodeDefType>): boolean => getRequiredIf(nodeDef).length > 0

/**
 * True if the node def is always required or required when a condition is met (node def level, not record level).
 */
const isRequiredOrConditionallyRequired = (nodeDef: ArenaNodeDef<NodeDefType>): boolean =>
  isRequired(nodeDef) || isRequiredIfDefined(nodeDef)

// // Min/max count

const getCount = (
  nodeDef: ArenaNodeDef<NodeDefType>,
  countType: NodeDefCountType
): ArenaNodeDefCountExpression | undefined => {
  const countValidations = getValidations(nodeDef)?.count
  if (!countValidations) return undefined
  return countType === NodeDefCountType.max ? countValidations.max : countValidations.min
}

const getMinCount = (nodeDef: ArenaNodeDef<NodeDefType>): ArenaNodeDefCountExpression | undefined =>
  getCount(nodeDef, NodeDefCountType.min)

const getMaxCount = (nodeDef: ArenaNodeDef<NodeDefType>): ArenaNodeDefCountExpression | undefined =>
  getCount(nodeDef, NodeDefCountType.max)

const hasMinOrMaxCount = (nodeDef: ArenaNodeDef<NodeDefType>): boolean =>
  Objects.isNotEmpty(getMinCount(nodeDef)) || Objects.isNotEmpty(getMaxCount(nodeDef))

// layout
const getLayoutProps =
  (cycle = defaultCycle) =>
  (nodeDef: ArenaNodeDef<any, ArenaNodeDefPropsWithLayout<any>>): any =>
    nodeDef?.props?.layout?.[cycle] ?? {}

const getLayoutRenderType =
  (cycle = defaultCycle) =>
  (nodeDef: ArenaNodeDef<any, ArenaNodeDefPropsWithLayout<any>>): string | undefined =>
    getLayoutProps(cycle)(nodeDef).renderType

const isLayoutRenderTypeForm =
  (cycle = defaultCycle) =>
  (nodeDef: ArenaNodeDefEntity): boolean =>
    getLayoutRenderType(cycle)(nodeDef) === NodeDefEntityRenderType.form

const isLayoutRenderTypeTable =
  (cycle = defaultCycle) =>
  (nodeDef: ArenaNodeDefEntity): boolean =>
    getLayoutRenderType(cycle)(nodeDef) === NodeDefEntityRenderType.table

const isLayoutRenderTypeHyperlink =
  (cycle = defaultCycle) =>
  (nodeDef: ArenaNodeDefText): boolean =>
    getLayoutRenderType(cycle)(nodeDef) === NodeDefTextRenderType.hyperlink

const isLayoutRenderTypeMarkdown =
  (cycle = defaultCycle) =>
  (nodeDef: ArenaNodeDefText): boolean =>
    getLayoutRenderType(cycle)(nodeDef) === NodeDefTextRenderType.markdown

const getChildrenEntitiesInOwnPageUuids =
  (cycle = defaultCycle) =>
  (nodeDef: ArenaNodeDefEntity): string[] =>
    (getLayoutProps(cycle)(nodeDef) as ArenaNodeDefEntityLayout).indexChildren ?? []

const getLayoutChildren =
  (cycle = defaultCycle) =>
  (nodeDef: ArenaNodeDefEntity): ArenaNodeDefEntityLayoutChildItem[] =>
    (getLayoutProps(cycle)(nodeDef) as ArenaNodeDefEntityLayout).layoutChildren ?? []

const getPageUuid =
  (cycle = defaultCycle) =>
  (nodeDef: ArenaNodeDefEntity): string | undefined =>
    (getLayoutProps(cycle)(nodeDef) as ArenaNodeDefEntityLayout).pageUuid

const isDisplayInOwnPage =
  (cycle = defaultCycle) =>
  (nodeDef: ArenaNodeDefEntity): boolean =>
    !!getPageUuid(cycle)(nodeDef)

const isHiddenInMobile =
  (cycle = defaultCycle) =>
  <L extends ArenaNodeDefLayout>(nodeDef: ArenaNodeDef<any, ArenaNodeDefPropsWithLayout<L>>): boolean =>
    getLayoutProps(cycle)(nodeDef).hiddenInMobile ?? false

const isIncludedInMultipleEntitySummary =
  (cycle = defaultCycle) =>
  <L extends ArenaNodeDefLayout>(nodeDef: ArenaNodeDef<any, ArenaNodeDefPropsWithLayout<L>>): boolean =>
    getLayoutProps(cycle)(nodeDef).includedInMultipleEntitySummary ?? false

const isIncludedInPreviousCycleLink =
  (cycle = defaultCycle) =>
  <L extends ArenaNodeDefLayout>(nodeDef: ArenaNodeDef<any, ArenaNodeDefPropsWithLayout<L>>): boolean =>
    getLayoutProps(cycle)(nodeDef).includedInPreviousCycleLink ?? true

const isHiddenWhenNotRelevant =
  (cycle = defaultCycle) =>
  <L extends ArenaNodeDefLayout>(nodeDef: ArenaNodeDef<any, ArenaNodeDefPropsWithLayout<L>>): boolean =>
    getLayoutProps(cycle)(nodeDef).hiddenWhenNotRelevant ?? false

const isCodeShown =
  (cycle = defaultCycle) =>
  (nodeDef: ArenaNodeDefCode): boolean =>
    !!(getLayoutProps(cycle)(nodeDef).codeShown ?? true)

// Analysis
const getAreaBasedEstimatedOf = (nodeDef: ArenaNodeDef<any>): string | undefined =>
  nodeDef.propsAdvancedDraft?.areaBasedEstimatedOf ?? nodeDef.propsAdvanced?.areaBasedEstimatedOf

const getIndexInChain = (nodeDef: ArenaNodeDef<any>): number | undefined => nodeDef.propsAdvanced?.index

// Metadata
const getMetaHierarchy = (nodeDef: ArenaNodeDef<any>): string[] => nodeDef.meta?.h ?? []

export const NodeDefs = {
  isEntity,
  isBoolean,
  isCode,
  isCoordinate,
  isDate,
  isDecimal,
  isFile,
  isGeo,
  isInteger,
  isTaxon,
  isText,
  isTime,
  isMultiple,
  isMultipleEntity,
  isSingle,
  isSingleEntity,
  isAttribute,
  isSingleAttribute,
  isMultipleAttribute,
  isKey,
  isAutoIncrementalKey,
  isQualifier,
  isReadOnly,
  isHidden,
  isEnumerate,
  getEnumeratingItemsExpression,
  isAutoCreateMinCountItems,
  getPrintOrientation,
  isAnalysis,
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
  isExcludedInClone,
  getEditableIf,
  isAlwaysEditable,
  getVisibleIf,
  isAlwaysVisible,

  getCategoryUuid,
  getParentCodeDefUuid,
  isAllowOnlyDeviceCoordinate,
  getCoordinateAdditionalFields,
  getMaxNumberDecimalDigits,
  getFileNameExpression,
  getFileType,
  getFileMaxSize,
  isGeotagInformationShown,
  isScreenCaptureInMapAllowed,
  isPositionTracking,
  isSecondsIncluded,
  getTaxonomyUuid,
  isVernacularNameSelectionKept,
  isVernacularNameAlwaysIncludedIfSingle,
  getTextTransform,
  getTextInputType,
  getItemsFilter,

  // layout
  getLayoutProps,
  getLayoutRenderType,
  isLayoutRenderTypeForm,
  isLayoutRenderTypeTable,
  getChildrenEntitiesInOwnPageUuids,
  getLayoutChildren,
  getPageUuid,
  isDisplayInOwnPage,
  isHiddenInMobile,
  isIncludedInMultipleEntitySummary,
  isIncludedInPreviousCycleLink,
  isHiddenWhenNotRelevant,
  isCodeShown,
  isLayoutRenderTypeHyperlink,
  isLayoutRenderTypeMarkdown,
  // validations
  getValidations,
  getValidationsExpressions,
  isRequired,
  getRequiredIf,
  isRequiredIfDefined,
  isRequiredOrConditionallyRequired,
  // // Min Max
  hasMinOrMaxCount,
  getCount,
  getMaxCount,
  getMinCount,
  // Analysis
  getAreaBasedEstimatedOf,
  getIndexInChain,
  // Metadata
  getMetaHierarchy,
}
