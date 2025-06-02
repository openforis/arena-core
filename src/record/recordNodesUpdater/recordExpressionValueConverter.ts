import { Point, Points } from '../../geo'
import { Node, NodeValueCode, NodeValueTaxon } from '../../node'
import { Survey, Surveys } from '../../survey'
import { Record } from '../record'
import { Records } from '../records'
import { NodeDef, NodeDefType, NodeDefs, NodeDefCodeProps, NodeDefTaxon, NodeDefCode } from '../../nodeDef'
import { Dates, DateFormats, Objects } from '../../utils'
import { CategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { TaxonProvider } from '../../nodeDefExpressionEvaluator/taxonProvider'

interface ToNodeValueParams {
  survey: Survey
  record: Record
  nodeParent: Node
  nodeDef: NodeDef<any>
  valueExpr: string
  timezoneOffset?: number
  categoryItemProvider?: CategoryItemProvider
  taxonProvider?: TaxonProvider
}

const _toPrimitive = (TypeTo: any) => (params: ToNodeValueParams) => {
  const { valueExpr: val } = params
  return TypeTo(val)
}

const _toBoolean = (params: ToNodeValueParams) => {
  const { valueExpr } = params
  if (['true', 'false'].includes(String(valueExpr))) return String(valueExpr)
  return null
}

const _findCategoryItemUuidByCode = async (params: {
  survey: Survey
  record: Record
  nodeDef: NodeDefCode
  nodeParent: Node
  code: string
  categoryItemProvider?: CategoryItemProvider
}): Promise<string | undefined> => {
  const { survey, record, nodeDef, nodeParent, code, categoryItemProvider } = params
  const codeNodeDef = nodeDef as NodeDef<NodeDefType.code, NodeDefCodeProps>

  const categoryItemUuid = Records.getCategoryItemUuid({
    survey,
    record,
    nodeDef: codeNodeDef,
    parentNode: nodeParent,
    code,
  })
  if (categoryItemUuid) return categoryItemUuid
  if (!categoryItemProvider) return undefined

  const categoryUuid = NodeDefs.getCategoryUuid(nodeDef)
  if (!categoryUuid) return undefined
  const codePaths = [...Records.getAncestorCodePath({ survey, record, parentNode: nodeParent, nodeDef }), code]
  const draft = !!record.preview
  const item = await categoryItemProvider.getItemByCodePaths({ survey, categoryUuid, codePaths, draft })
  return item?.uuid
}

const _toCode = async (params: ToNodeValueParams): Promise<NodeValueCode | null> => {
  const { survey, record, nodeDef, nodeParent, valueExpr, categoryItemProvider } = params

  if (!nodeParent) return null

  // ValueExpr is the code of a category item
  const code = String(valueExpr)

  const categoryItemUuid = await _findCategoryItemUuidByCode({
    survey,
    record,
    nodeDef: nodeDef as NodeDefCode,
    nodeParent,
    code,
    categoryItemProvider,
  })

  return categoryItemUuid ? { itemUuid: categoryItemUuid } : null
}

const _toCoordinate = (params: ToNodeValueParams): Point | null => {
  const { valueExpr } = params
  return Points.parse(valueExpr)
}

const _toDateTime = (params: {
  valueExpr: any
  format: DateFormats
  formatsFrom: DateFormats[]
  timezoneOffset?: number
}): string | null => {
  const { valueExpr, format, formatsFrom = [DateFormats.datetimeDefault], timezoneOffset } = params
  const formatFrom = formatsFrom.find((formt) => Dates.isValidDateInFormat(valueExpr, formt))
  if (!formatFrom) return null

  const date = Dates.parse(valueExpr, formatFrom)
  if (!date) return null

  const localTimezoneOffset = Dates.getTimezoneOffset()
  const timezoneOffsetDiff = localTimezoneOffset - (timezoneOffset ?? localTimezoneOffset)
  const dateWithTimezoneOffset = timezoneOffsetDiff ? new Date(date.getTime() + timezoneOffsetDiff * 60000) : date
  return Dates.format(dateWithTimezoneOffset, format)
}

const findTaxonByCode = async (params: {
  survey: Survey
  nodeDef: NodeDefTaxon
  taxonCode: string
  draft: boolean
  taxonProvider?: TaxonProvider
}) => {
  const { survey, nodeDef, taxonCode, taxonProvider, draft } = params
  const taxonomyUuid = NodeDefs.getTaxonomyUuid(nodeDef)!
  const taxon = Surveys.getTaxonByCode({ survey, taxonomyUuid, taxonCode })
  if (taxon) return taxon
  if (!taxonProvider) return null
  return taxonProvider.getTaxonByCode({ survey, taxonomyUuid, taxonCode, draft })
}

const _toTaxon = async (params: ToNodeValueParams): Promise<NodeValueTaxon | null> => {
  const { survey, record, nodeDef, valueExpr, taxonProvider } = params

  // ValueExpr is the code of a taxon
  const taxonCode = String(valueExpr)

  const taxonNodeDef = nodeDef as NodeDefTaxon
  const draft = !!record.preview
  const taxon = await findTaxonByCode({ survey, nodeDef: taxonNodeDef, taxonCode, taxonProvider, draft })
  return taxon ? { taxonUuid: taxon.uuid } : null
}

const _valueExprToValueNodeFns: { [key in NodeDefType]?: (params: ToNodeValueParams) => any } = {
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
  [NodeDefType.geo]: (params: { valueExpr: any }) => {
    const { valueExpr } = params
    return typeof valueExpr === 'string' ? JSON.parse(valueExpr) : valueExpr
  },
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
}

const toNodeValue = async (params: ToNodeValueParams): Promise<any> => {
  const { nodeDef, valueExpr } = params
  if (Objects.isEmpty(valueExpr)) return null

  const fn = _valueExprToValueNodeFns[NodeDefs.getType(nodeDef)]
  return fn?.(params)
}

export const RecordExpressionValueConverter = {
  toNodeValue,
}
