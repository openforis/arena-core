import { CategoryItems } from '../category'
import { Point, PointFactory } from '../geo'
import { NodeDef, NodeDefCode, NodeDefProps, NodeDefType } from '../nodeDef'
import { Record, Records } from '../record'
import { Survey, Surveys } from '../survey'
import { DateFormats, Dates, Objects } from '../utils'
import { Node } from './node'
import { NodeValueCoordinate } from './nodeValue/coordinate'
import {
  ValuePropsCode,
  ValuePropsCoordinate,
  ValuePropsDate,
  ValuePropsFile,
  ValuePropsTaxon,
  ValuePropsTime,
} from './nodeValueProps'

/**
 * Props of node value indexed by node def type.
 * The node definitions here are only the ones of "composite" attributes.
 */
export const ValuePropsByType: { [key in NodeDefType]: { [key: string]: string } | null } = {
  [NodeDefType.boolean]: null,
  [NodeDefType.code]: ValuePropsCode,
  [NodeDefType.coordinate]: ValuePropsCoordinate,
  [NodeDefType.date]: ValuePropsDate,
  [NodeDefType.decimal]: null,
  [NodeDefType.geo]: null,
  [NodeDefType.entity]: null,
  [NodeDefType.file]: ValuePropsFile,
  [NodeDefType.integer]: null,
  [NodeDefType.taxon]: ValuePropsTaxon,
  [NodeDefType.time]: ValuePropsTime,
  [NodeDefType.text]: null,
  // layout elements
  [NodeDefType.formHeader]: null,
}

const getValuePropRaw = (params: { value: any; prop: string; defaultValue?: any }): any => {
  const { value, prop, defaultValue } = params
  const valueProp = value?.[prop]
  return valueProp === undefined ? defaultValue : valueProp
}

const getNodeValuePropRaw = (params: { node: Node; prop: string; defaultValue?: any }): any => {
  const { node, prop, defaultValue } = params
  return getValuePropRaw({ value: node.value, prop, defaultValue })
}

// Code
const newCodeValue = (params: { itemUuid: string }) => {
  const { itemUuid } = params
  return { [ValuePropsCode[ValuePropsCode.itemUuid]]: itemUuid }
}

const getItemUuid = (node: Node): string | undefined =>
  getNodeValuePropRaw({ node, prop: ValuePropsCode[ValuePropsCode.itemUuid] })

const getValueCode = (value: any): string | undefined =>
  getValuePropRaw({ value, prop: ValuePropsCode[ValuePropsCode.code] })

const getValueItemUuid = (value: any): string | undefined =>
  getValuePropRaw({ value, prop: ValuePropsCode[ValuePropsCode.itemUuid] })

const getDateTimePart = (params: { node: Node; index: number; separator: string }): number => {
  const { node, index, separator } = params
  return Number((node.value ?? '').split(separator)[index]?.trim())
}

// Date
const getDatePart =
  (index: number) =>
  (node: Node): number =>
    getDateTimePart({ node, index, separator: '-' })
const getDateYear = getDatePart(0)
const getDateMonth = getDatePart(1)
const getDateDay = getDatePart(2)

const _datePropGetters: { [key in ValuePropsDate]: (node: Node) => number } = {
  [ValuePropsDate.day]: getDateDay,
  [ValuePropsDate.month]: getDateMonth,
  [ValuePropsDate.year]: getDateYear,
}

// File
const getFileName = (node: Node): string | undefined => getNodeValuePropRaw({ node, prop: ValuePropsFile.fileName })
const getFileNameCalculated = (node: Node): string | undefined =>
  getNodeValuePropRaw({ node, prop: ValuePropsFile.fileNameCalculated })
const getFileSize = (node: Node): string | undefined => getNodeValuePropRaw({ node, prop: ValuePropsFile.fileSize })
const getFileUuid = (node: Node): string | undefined => getNodeValuePropRaw({ node, prop: ValuePropsFile.fileUuid })

// Taxon
const getTaxonUuid = (node: Node): string | undefined =>
  getNodeValuePropRaw({ node, prop: ValuePropsTaxon[ValuePropsTaxon.taxonUuid] })
const getValueTaxonUuid = (value: any): string | undefined =>
  getValuePropRaw({ value, prop: ValuePropsTaxon[ValuePropsTaxon.taxonUuid] })
const getScientificName = (node: Node): string | undefined =>
  getNodeValuePropRaw({ node, prop: ValuePropsTaxon[ValuePropsTaxon.scientificName] })
const getValueScientificName = (value: any): string | undefined =>
  getValuePropRaw({ value, prop: ValuePropsTaxon[ValuePropsTaxon.scientificName] })
const getVernacularName = (node: Node): string | undefined =>
  getNodeValuePropRaw({ node, prop: ValuePropsTaxon[ValuePropsTaxon.vernacularName] })
const getValueVernacularName = (value: any): string | undefined =>
  getValuePropRaw({ value, prop: ValuePropsTaxon[ValuePropsTaxon.vernacularName] })
const getVernacularNameUuid = (node: Node): string | undefined =>
  getNodeValuePropRaw({ node, prop: ValuePropsTaxon[ValuePropsTaxon.vernacularNameUuid] })
const getValueVernacularNameUuid = (value: any): string | undefined =>
  getValuePropRaw({ value, prop: ValuePropsTaxon[ValuePropsTaxon.vernacularNameUuid] })

// Time
const _getTimePart =
  (index: number) =>
  (node: Node): number =>
    getDateTimePart({ node, index, separator: ':' })
const getTimeHour = _getTimePart(0)
const getTimeMinute = _getTimePart(1)

const _timePropGetters: { [key in ValuePropsTime]: any } = {
  [ValuePropsTime.hour]: getTimeHour,
  [ValuePropsTime.minute]: getTimeMinute,
}

const _valuePropGetters: { [key in NodeDefType]?: (prop: string) => (node: Node) => number } = {
  [NodeDefType.date]: (prop: string) => _datePropGetters[ValuePropsDate[prop as keyof typeof ValuePropsDate]],
  [NodeDefType.time]: (prop: string) => _timePropGetters[ValuePropsTime[prop as keyof typeof ValuePropsTime]],
}

const isValueProp = (params: { nodeDef: NodeDef<NodeDefType, NodeDefProps>; prop: string }): boolean => {
  const { nodeDef, prop } = params
  return Object.values(ValuePropsByType[nodeDef.type] ?? {}).includes(prop)
}

const getNodeValueProp = (params: { nodeDef: NodeDef<NodeDefType, NodeDefProps>; node: Node; prop: string }): any => {
  const { nodeDef, node, prop } = params
  const propGetter: any = _valuePropGetters[nodeDef.type]
  return propGetter ? propGetter(prop)(node) : getNodeValuePropRaw({ node, prop })
}

// value compare

const singlePropValueEqualComparator = (params: NodeValuesCompareParams): boolean => {
  const { value, valueSearch } = params
  return value === valueSearch || String(value) === String(valueSearch)
}

const extractCategoryItemUuidFromValue = (params: NodeValuesCompareParams): string | undefined => {
  const { survey, nodeDef, record, parentNode, value } = params
  const valueItemUuid = getValueItemUuid(value)
  if (valueItemUuid) {
    return valueItemUuid
  }
  // find itemUuid by code
  const valueCode = getValueCode(value)
  if (Objects.isEmpty(valueCode)) return undefined

  const nodeDefCode = nodeDef as NodeDefCode
  const code = valueCode!
  const categoryUuid = nodeDefCode.props?.categoryUuid
  const levelIndex = Surveys.getNodeDefCategoryLevelIndex({ survey, nodeDef: nodeDefCode })
  if (levelIndex === 0) {
    return Surveys.getCategoryItemUuidByCode({ survey, categoryUuid, parentItemUuid: undefined, code })
  }
  if (!record || !parentNode) return undefined

  const parentCodeAttribute = Records.getParentCodeAttribute({ parentNode, nodeDef: nodeDef as NodeDefCode })(record)
  if (!parentCodeAttribute) return undefined

  const parentItemUuid = getItemUuid(parentCodeAttribute)
  if (!parentItemUuid) return undefined

  return Surveys.getCategoryItemUuidByCode({
    survey,
    categoryUuid,
    parentItemUuid,
    code,
  })
}

const extractCategoryItemCodeFromValue = (params: { survey: Survey; value: any }): string | undefined => {
  const { survey, value } = params
  const itemUuid = getValueItemUuid(value)
  if (itemUuid) {
    const item = Surveys.getCategoryItemByUuid({ survey, itemUuid })
    return item ? CategoryItems.getCode(item) : undefined
  }
  return getValueCode(value)
}

const dateTimeComparator =
  (params: { formatsSource: DateFormats[]; formatTo: DateFormats }) =>
  (paramsComparator: NodeValuesCompareParams): boolean => {
    const { formatsSource, formatTo } = params
    const { value, valueSearch } = paramsComparator
    const toDateTime = (val: any) => {
      if (val instanceof Date) {
        return Dates.format(val, formatTo)
      }
      const formatFrom = formatsSource.find((format) => Dates.isValidDateInFormat(val, format))
      return formatFrom ? Dates.convertDate({ dateStr: val, formatFrom, formatTo }) : null
    }
    const dateTime = toDateTime(value)
    const dateTimeSearch = toDateTime(valueSearch)
    return !!dateTime && !!dateTimeSearch && dateTime === dateTimeSearch
  }

const valueComparatorByNodeDefType: { [key in NodeDefType]?: (params: NodeValuesCompareParams) => boolean } = {
  [NodeDefType.boolean]: singlePropValueEqualComparator,
  [NodeDefType.code]: (params: NodeValuesCompareParams): boolean => {
    const { survey, record, value, valueSearch, strict } = params
    if (!strict || !record) {
      // compare just codes (record not available, tricky to find the "correct" category item without knowing its parent item)
      const code = extractCategoryItemCodeFromValue({ survey, value })
      const codeSearch = extractCategoryItemCodeFromValue({ survey, value: valueSearch })
      return !!code && !!codeSearch && code === codeSearch
    }
    const itemUuid = extractCategoryItemUuidFromValue(params)
    const itemUuidSearch = extractCategoryItemUuidFromValue({
      ...params,
      value: valueSearch,
    })
    return !!itemUuidSearch && !!itemUuid && itemUuidSearch === itemUuid
  },
  [NodeDefType.coordinate]: (params: NodeValuesCompareParams) => {
    const { value, valueSearch } = params
    return Objects.isEqual(value, valueSearch)
  },
  [NodeDefType.date]: dateTimeComparator({
    formatsSource: [DateFormats.dateDisplay, DateFormats.dateStorage],
    formatTo: DateFormats.dateStorage,
  }),
  [NodeDefType.decimal]: singlePropValueEqualComparator,
  [NodeDefType.integer]: singlePropValueEqualComparator,
  [NodeDefType.taxon]: ({ value, valueSearch }) => {
    if (value === valueSearch) return true
    if (!value) return false
    if (!valueSearch) return false
    return value[ValuePropsTaxon.taxonUuid] === valueSearch[ValuePropsTaxon.taxonUuid]
  },
  [NodeDefType.text]: singlePropValueEqualComparator,
  [NodeDefType.time]: dateTimeComparator({
    formatsSource: [DateFormats.timeStorage, DateFormats.timeWithSeconds],
    formatTo: DateFormats.timeStorage,
  }),
}

interface NodeValuesCompareParams {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, any>
  value: any
  valueSearch: any
  record?: Record
  parentNode?: Node
  strict?: boolean
}

const isValueEqual = (params: NodeValuesCompareParams): boolean => {
  const { survey, nodeDef, value, valueSearch, record = undefined, parentNode = undefined, strict = false } = params
  if (value === valueSearch) return true
  if (Objects.isEmpty(value) || Objects.isEmpty(valueSearch)) return false

  const valueComparator = valueComparatorByNodeDefType[nodeDef.type]
  if (!valueComparator) {
    return Objects.isEqual(value, valueSearch)
  }
  return valueComparator({ survey, nodeDef, record, parentNode, value, valueSearch, strict })
}

const getValueAsPoint = (params: { survey: Survey; node: Node }): Point | null => {
  const { survey, node } = params
  const nodeValue = node?.value

  if (!nodeValue) return null

  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
  if (nodeDef.type === NodeDefType.coordinate) {
    const { x, y, srs } = nodeValue as NodeValueCoordinate

    const srsObject = Surveys.getSRSByCode(srs)(survey)
    if (!srsObject) return null

    return PointFactory.createInstance({ srs, x, y })
  }
  return null
}

export const NodeValues = {
  ValuePropsByType,
  ValuePropsCode,
  ValuePropsCoordinate,
  ValuePropsDate,
  ValuePropsFile,
  ValuePropsTaxon,
  ValuePropsTime,

  getNodeValueProp,
  isValueProp,

  // coordinate
  getValueAsPoint,

  // code
  newCodeValue,
  getItemUuid,
  getValueCode,
  getValueItemUuid,

  // date
  getDateYear,
  getDateMonth,
  getDateDay,

  // file
  getFileName,
  getFileNameCalculated,
  getFileSize,
  getFileUuid,

  // taxon
  getTaxonUuid,
  getValueTaxonUuid,
  getScientificName,
  getValueScientificName,
  getVernacularName,
  getValueVernacularName,
  getVernacularNameUuid,
  getValueVernacularNameUuid,

  // time
  getTimeHour,
  getTimeMinute,

  // utils
  isValueEqual,
}
