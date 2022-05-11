import { Node } from '../../node'
import { Survey, Surveys } from '../../survey'
import { Record } from '../record'
import { Records } from '../records'

const _toBoolean = ({ valueExpr }) => {
  if (R.is(Boolean, valueExpr)) {
    return String(valueExpr)
  }
  if (R.is(String, valueExpr) && R.includes(valueExpr, ['true', 'false'])) {
    return valueExpr
  }
  return null
}

const _toCode = (params: { survey: Survey; record: Record; nodeCtx: Node; valueExpr: any }) => {
  const { survey, record, nodeCtx, valueExpr } = params
  // ValueExpr is the code of a category item
  const code = String(valueExpr)
  if (code === null) {
    return null
  }

  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeCtx.nodeDefUuid })
  const parentNode = Records.getParent({ record, node: nodeCtx })

  const { itemUuid } = Surveys.getcate Survey.getCategoryItemUuidAndCodeHierarchy(nodeDef, record, parentNode, code)(survey)

  return itemUuid ? { [Node.valuePropsCode.itemUuid]: itemUuid } : null
}

const _toCoordinate = ({ valueExpr }) => (valueExpr ? Points.parse(valueExpr) : null)

const _toDateTime = ({ valueExpr, format, formatsFrom = [DateUtils.formats.datetimeDefault] }) => {
  if (!valueExpr) {
    return null
  }
  const formatFrom = formatsFrom.find((formt) => DateUtils.isValidDateInFormat(valueExpr, formt))
  return formatFrom ? DateUtils.convertDate({ dateStr: valueExpr, formatFrom, formatTo: format }) : null
}

const _toTaxon = ({ survey, nodeCtx, valueExpr }) => {
  // ValueExpr is the code of a taxon
  const taxonCode = _toPrimitive(valueExpr, String)
  if (taxonCode === null) {
    return null
  }

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(nodeCtx))(survey)
  const taxonUuid = Survey.getTaxonUuid(nodeDef, taxonCode)(survey)

  return taxonUuid ? { [Node.valuePropsTaxon.taxonUuid]: taxonUuid } : null
}

const _valueExprToValueNodeFns = {
  [NodeDef.nodeDefType.boolean]: _toBoolean,
  [NodeDef.nodeDefType.code]: _toCode,
  [NodeDef.nodeDefType.coordinate]: _toCoordinate,
  [NodeDef.nodeDefType.date]: ({ valueExpr }) =>
    _toDateTime({
      valueExpr,
      format: DateUtils.formats.dateISO,
      formatsFrom: [DateUtils.formats.datetimeDefault, DateUtils.formats.dateISO],
    }),
  [NodeDef.nodeDefType.decimal]: ({ valueExpr }) => _toPrimitive(valueExpr, Number),
  [NodeDef.nodeDefType.integer]: ({ valueExpr }) => _toPrimitive(valueExpr, Number),
  [NodeDef.nodeDefType.taxon]: _toTaxon,
  [NodeDef.nodeDefType.text]: ({ valueExpr }) => _toPrimitive(valueExpr, String),
  [NodeDef.nodeDefType.time]: ({ valueExpr }) =>
    _toDateTime({
      valueExpr,
      format: DateUtils.formats.timeStorage,
      formatsFrom: [DateUtils.formats.datetimeDefault, DateUtils.formats.timeStorage],
    }),
}

export const toNodeValue = (survey, record, nodeCtx, valueExpr) => {
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(nodeCtx))(survey)
  const fn = _valueExprToValueNodeFns[NodeDef.getType(nodeDef)]
  if (!fn) throw new Error(`Unsupported type ${NodeDef.getType(nodeDef)} for record node value conversion`)
  return fn({ survey, record, nodeCtx, valueExpr })
}
