import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'
import { Node } from './node'

enum valuePropsCode {
  code,
  itemUuid,
  label,
}

enum valuePropsCoordinate {
  x,
  y,
  srs,
}

enum valuePropsDate {
  day,
  month,
  year,
}

enum valuePropsFile {
  fileUuid,
  fileName,
  fileSize,
}

enum valuePropsTaxon {
  code,
  scientificName,
  taxonUuid,
  vernacularName,
  vernacularNameUuid,
}

enum valuePropsTime {
  hour,
  minute,
}

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

const getValuePropRaw = (params: { node: Node; prop: string; defaultValue?: any }): any | undefined => {
  const { node, prop, defaultValue } = params
  const valueProp = node.value?.[prop]
  return valueProp === undefined ? defaultValue : valueProp
}

// Code
const getItemUuid = (node: Node): string | undefined =>
  getValuePropRaw({ node, prop: valuePropsCode[valuePropsCode.itemUuid] })

// Date
const getDatePart = (index: number) => (node: Node) => Number((node.value || '--').split('-')[index].trim())
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
  getValuePropRaw({ node, prop: valuePropsTaxon[valuePropsTaxon.taxonUuid] })

// Time
const _getTimePart = (index: number) => (node: Node) => Number((node.value || ':').split(':')[index].trim())
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

const getValueProp = (params: { nodeDef: NodeDef<NodeDefType, NodeDefProps>; node: Node; prop: string }): any => {
  const { nodeDef, node, prop } = params
  const propGetter: any = _valuePropGetters[nodeDef.type]
  return propGetter ? propGetter(prop)(node) : getValuePropRaw({ node, prop })
}

export const NodeValues = {
  valuePropsCode,

  getValueProp,
  isValueProp,
  // code
  getItemUuid,
  // taxon
  getTaxonUuid,
}
