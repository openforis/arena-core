import { Point, Points } from '../../geo'
import { Node, NodeValueCode, NodeValueTaxon } from '../../node'
import { Survey, Surveys } from '../../survey'
import { Record } from '../record'
import { Records } from '../records'
import { NodeDef, NodeDefType, NodeDefs, NodeDefCodeProps, NodeDefTaxonProps } from '../../nodeDef'
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

const _toCode = (params: { survey: Survey; record: Record; nodeCtx: Node; valueExpr: any }): NodeValueCode | null => {
  const { survey, record, nodeCtx, valueExpr } = params

  // ValueExpr is the code of a category item
  const code = String(valueExpr)

  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeCtx.nodeDefUuid })
  const codeNodeDef = nodeDef as NodeDef<NodeDefType.code, NodeDefCodeProps>
  const parentNode = Records.getParent({ record, node: nodeCtx })
  if (!parentNode) return null

  const categoryItemUuid = Records.getCategoryItemUuid({ survey, record, nodeDef: codeNodeDef, parentNode, code })

  return categoryItemUuid ? { itemUuid: categoryItemUuid } : null
}

const _toCoordinate = (params: { valueExpr: any }): Point | null => {
  const { valueExpr } = params
  return Points.parse(valueExpr)
}

const _toDateTime = (params: { valueExpr: any; format: DateFormats; formatsFrom: DateFormats[] }) => {
  const { valueExpr, format, formatsFrom = [DateFormats.datetimeDefault] } = params
  const formatFrom = formatsFrom.find((formt) => Dates.isValidDateInFormat(valueExpr, formt))
  return formatFrom ? Dates.convertDate({ dateStr: valueExpr, formatFrom, formatTo: format }) : null
}

const _toTaxon = (params: { survey: Survey; nodeCtx: Node; valueExpr: any }): NodeValueTaxon | null => {
  const { survey, nodeCtx, valueExpr } = params

  // ValueExpr is the code of a taxon
  const taxonCode = String(valueExpr)

  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeCtx.nodeDefUuid }) as NodeDef<
    NodeDefType.taxon,
    NodeDefTaxonProps
  >
  const taxon = Surveys.getTaxonByCode({ survey, taxonomyUuid: nodeDef.props.taxonomyUuid, taxonCode })
  return taxon ? { taxonUuid: taxon.uuid } : null
}

const _valueExprToValueNodeFns = {
  [NodeDefType.boolean]: _toBoolean,
  [NodeDefType.code]: _toCode,
  [NodeDefType.coordinate]: _toCoordinate,
  [NodeDefType.date]: (params: { valueExpr: any }) => {
    const { valueExpr } = params
    return _toDateTime({
      valueExpr,
      format: DateFormats.dateISO,
      formatsFrom: [DateFormats.datetimeDefault, DateFormats.dateISO],
    })
  },
  [NodeDefType.decimal]: _toPrimitive(Number),
  [NodeDefType.integer]: _toPrimitive(Number),
  [NodeDefType.taxon]: _toTaxon,
  [NodeDefType.text]: _toPrimitive(String),
  [NodeDefType.time]: (params: { valueExpr: any }) => {
    const { valueExpr } = params
    return _toDateTime({
      valueExpr,
      format: DateFormats.timeStorage,
      formatsFrom: [DateFormats.datetimeDefault, DateFormats.timeStorage],
    })
  },
  // not supported types
  [NodeDefType.file]: () => null,
  [NodeDefType.entity]: () => null,
}

const toNodeValue = (params: { survey: Survey; record: Record; nodeCtx: Node; valueExpr: string }) => {
  const { survey, record, nodeCtx, valueExpr } = params
  if (Objects.isEmpty(valueExpr)) return null

  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeCtx.nodeDefUuid })
  const fn = _valueExprToValueNodeFns[NodeDefs.getType(nodeDef)]
  return fn({ survey, record, nodeCtx, valueExpr })
}

export const RecordExpressionValueConverter = {
  toNodeValue,
}
