import { Point, Points } from '../../geo'
import { Node, NodeValueCode, NodeValueTaxon } from '../../node'
import { Survey, Surveys } from '../../survey'
import { Record } from '../record'
import { Records } from '../records'
import { NodeDef, NodeDefType, NodeDefs, NodeDefCodeProps, NodeDefTaxon } from '../../nodeDef'
import { Dates, DateFormats, Objects } from '../../utils'

const _toPrimitive = (TypeTo: any) => (params: { valueExpr: any }) => {
  const { valueExpr: val } = params
  return TypeTo(val)
}

const _toBoolean = (params: { valueExpr: any }) => {
  const { valueExpr } = params
  if (['true', 'false'].includes(String(valueExpr))) return String(valueExpr)
  return null
}

const _toCode = (params: {
  survey: Survey
  record: Record
  nodeDef: NodeDef<any>
  nodeParent: Node
  valueExpr: any
}): NodeValueCode | null => {
  const { survey, record, nodeDef, nodeParent, valueExpr } = params

  if (!nodeParent) return null

  // ValueExpr is the code of a category item
  const code = String(valueExpr)

  const codeNodeDef = nodeDef as NodeDef<NodeDefType.code, NodeDefCodeProps>

  const categoryItemUuid = Records.getCategoryItemUuid({
    survey,
    record,
    nodeDef: codeNodeDef,
    parentNode: nodeParent,
    code,
  })

  return categoryItemUuid ? { itemUuid: categoryItemUuid } : null
}

const _toCoordinate = (params: { valueExpr: any }): Point | null => {
  const { valueExpr } = params
  return Points.parse(valueExpr)
}

const _toDateTime = (params: {
  valueExpr: any
  format: DateFormats
  formatsFrom: DateFormats[]
  timezoneOffset?: number
}) => {
  const { valueExpr, format, formatsFrom = [DateFormats.datetimeDefault], timezoneOffset } = params
  const formatFrom = formatsFrom.find((formt) => Dates.isValidDateInFormat(valueExpr, formt))
  if (!formatFrom) return null

  const date = Dates.parse(valueExpr, formatFrom)
  const localTimezoneOffset = Dates.getTimezoneOffset()
  const timezoneOffsetDiff = localTimezoneOffset - (timezoneOffset ?? localTimezoneOffset)
  const dateWithTimezoneOffset = timezoneOffsetDiff ? new Date(date.getTime() + timezoneOffsetDiff * 60000) : date
  return Dates.format(dateWithTimezoneOffset, format)
}

const _toTaxon = (params: { survey: Survey; nodeDef: NodeDef<any>; valueExpr: any }): NodeValueTaxon | null => {
  const { survey, nodeDef, valueExpr } = params

  // ValueExpr is the code of a taxon
  const taxonCode = String(valueExpr)

  const taxonNodeDef = nodeDef as NodeDefTaxon
  const taxon = Surveys.getTaxonByCode({ survey, taxonomyUuid: taxonNodeDef.props.taxonomyUuid, taxonCode })
  return taxon ? { taxonUuid: taxon.uuid } : null
}

const _valueExprToValueNodeFns = {
  [NodeDefType.boolean]: _toBoolean,
  [NodeDefType.code]: _toCode,
  [NodeDefType.coordinate]: _toCoordinate,
  [NodeDefType.date]: (params: { valueExpr: any; timezoneOffset?: number }) => {
    const { valueExpr, timezoneOffset } = params
    return _toDateTime({
      valueExpr,
      format: DateFormats.dateStorage,
      formatsFrom: [DateFormats.datetimeStorage, DateFormats.datetimeDefault, DateFormats.dateStorage],
      timezoneOffset,
    })
  },
  [NodeDefType.decimal]: _toPrimitive(Number),
  [NodeDefType.integer]: _toPrimitive(Number),
  [NodeDefType.taxon]: _toTaxon,
  [NodeDefType.text]: _toPrimitive(String),
  [NodeDefType.time]: (params: { valueExpr: any; timezoneOffset?: number }) => {
    const { valueExpr, timezoneOffset } = params
    return _toDateTime({
      valueExpr,
      format: DateFormats.timeStorage,
      formatsFrom: [DateFormats.datetimeStorage, DateFormats.datetimeDefault, DateFormats.timeStorage],
      timezoneOffset,
    })
  },
  // not supported types
  [NodeDefType.file]: () => null,
  [NodeDefType.entity]: () => null,
}

const toNodeValue = (params: {
  survey: Survey
  record: Record
  nodeParent: Node
  nodeDef: NodeDef<any>
  valueExpr: string
  timezoneOffset?: number
}) => {
  const { survey, record, nodeParent, nodeDef, valueExpr, timezoneOffset } = params
  if (Objects.isEmpty(valueExpr)) return null

  const fn = _valueExprToValueNodeFns[NodeDefs.getType(nodeDef)]
  return fn({ survey, record, nodeParent, nodeDef, valueExpr, timezoneOffset })
}

export const RecordExpressionValueConverter = {
  toNodeValue,
}
