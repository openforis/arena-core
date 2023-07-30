import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'
import { Node } from './node'
import {
  valuePropsCode,
  valuePropsCoordinate,
  valuePropsDate,
  valuePropsFile,
  valuePropsTaxon,
  valuePropsTime,
} from './nodeValueProps'

/**
 * Props of node value indexed by node def type.
 * The node definitions here are only the ones of "composite" attributes.
 */
export const valuePropsByType = {
  [NodeDefType.boolean]: null,
  [NodeDefType.code]: valuePropsCode,
  [NodeDefType.coordinate]: valuePropsCoordinate,
  [NodeDefType.date]: valuePropsDate,
  [NodeDefType.decimal]: null,
  [NodeDefType.entity]: null,
  [NodeDefType.file]: valuePropsFile,
  [NodeDefType.integer]: null,
  [NodeDefType.taxon]: valuePropsTaxon,
  [NodeDefType.time]: valuePropsTime,
  [NodeDefType.text]: null,
}

const getValuePropRaw = (params: { value: any; prop: string; defaultValue?: any }): any | undefined => {
  const { value, prop, defaultValue } = params
  const valueProp = value?.[prop]
  return valueProp === undefined ? defaultValue : valueProp
}

const getNodeValuePropRaw = (params: { node: Node; prop: string; defaultValue?: any }): any | undefined => {
  const { node, prop, defaultValue } = params
  return getValuePropRaw({ value: node.value, prop, defaultValue })
}

// Code
const newCodeValue = (params: { itemUuid: string }) => {
  const { itemUuid } = params
  return { [valuePropsCode[valuePropsCode.itemUuid]]: itemUuid }
}

const getItemUuid = (node: Node): string | undefined =>
  getNodeValuePropRaw({ node, prop: valuePropsCode[valuePropsCode.itemUuid] })

const getValueCode = (value: any): string | undefined =>
  getValuePropRaw({ value, prop: valuePropsCode[valuePropsCode.code] })

const getValueItemUuid = (value: any): string | undefined =>
  getValuePropRaw({ value, prop: valuePropsCode[valuePropsCode.itemUuid] })

const getDateTimePart = (params: { node: Node; index: number; separator: string }): number => {
  const { node, index, separator } = params
  return Number((node.value || '').split(separator)[index]?.trim())
}

// Date
const getDatePart =
  (index: number) =>
  (node: Node): number =>
    getDateTimePart({ node, index, separator: '-' })
const getDateYear = getDatePart(0)
const getDateMonth = getDatePart(1)
const getDateDay = getDatePart(2)

const _datePropGetters: { [key in valuePropsDate]: (node: Node) => number } = {
  [valuePropsDate.day]: getDateDay,
  [valuePropsDate.month]: getDateMonth,
  [valuePropsDate.year]: getDateYear,
}

// Taxon
const getTaxonUuid = (node: Node): string | undefined =>
  getNodeValuePropRaw({ node, prop: valuePropsTaxon[valuePropsTaxon.taxonUuid] })
const getValueTaxonUuid = (value: any): string | undefined =>
  getValuePropRaw({ value, prop: valuePropsTaxon[valuePropsTaxon.taxonUuid] })
const getVernacularNameUuid = (node: Node): string | undefined =>
  getNodeValuePropRaw({ node, prop: valuePropsTaxon[valuePropsTaxon.vernacularNameUuid] })
const getValueVernacularNameUuid = (value: any): string | undefined =>
  getValuePropRaw({ value, prop: valuePropsTaxon[valuePropsTaxon.vernacularNameUuid] })

// Time
const _getTimePart =
  (index: number) =>
  (node: Node): number =>
    getDateTimePart({ node, index, separator: ':' })
const getTimeHour = _getTimePart(0)
const getTimeMinute = _getTimePart(1)

const _timePropGetters: { [key in valuePropsTime]: any } = {
  [valuePropsTime.hour]: getTimeHour,
  [valuePropsTime.minute]: getTimeMinute,
}

const _valuePropGetters: { [key in NodeDefType]?: (prop: string) => (node: Node) => number } = {
  [NodeDefType.date]: (prop: string) => _datePropGetters[valuePropsDate[prop as keyof typeof valuePropsDate]],
  [NodeDefType.time]: (prop: string) => _timePropGetters[valuePropsTime[prop as keyof typeof valuePropsTime]],
}

const isValueProp = (params: { nodeDef: NodeDef<NodeDefType, NodeDefProps>; prop: string }): boolean => {
  const { nodeDef, prop } = params
  return Object.values(valuePropsByType[nodeDef.type] || {}).includes(prop)
}

const getNodeValueProp = (params: { nodeDef: NodeDef<NodeDefType, NodeDefProps>; node: Node; prop: string }): any => {
  const { nodeDef, node, prop } = params
  const propGetter: any = _valuePropGetters[nodeDef.type]
  return propGetter ? propGetter(prop)(node) : getNodeValuePropRaw({ node, prop })
}

export const NodeValues = {
  valuePropsCode,
  valuePropsCoordinate,
  valuePropsTaxon,

  getNodeValueProp,
  isValueProp,

  // time
  getTimeHour,
  getTimeMinute,

  // date
  getDateYear,
  getDateMonth,
  getDateDay,

  // code
  newCodeValue,
  getItemUuid,
  getValueCode,
  getValueItemUuid,

  // taxon
  getTaxonUuid,
  getValueTaxonUuid,
  getVernacularNameUuid,
  getValueVernacularNameUuid,
}
