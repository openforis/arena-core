import { ArenaPoint, Points } from '../../geo'
import { ArenaRecordNode, ArenaRecordNodeValueCode, ArenaRecordNodeValueTaxon } from '../../node'
import { ArenaSurvey, Surveys } from '../../survey'
import { ArenaRecord } from '../record'
import { Records } from '../records'
import {
  ArenaNodeDef,
  NodeDefType,
  NodeDefs,
  ArenaNodeDefCodeProps,
  ArenaNodeDefTaxon,
  ArenaNodeDefCode,
} from '../../nodeDef'
import { Dates, DateFormats, Objects } from '../../utils'
import { ArenaCategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { ArenaTaxonProvider } from '../../nodeDefExpressionEvaluator/taxonProvider'

interface ToNodeValueParams {
  survey: ArenaSurvey
  record: ArenaRecord
  nodeParent: ArenaRecordNode
  nodeDef: ArenaNodeDef<any>
  valueExpr: string
  timezoneOffset?: number
  categoryItemProvider?: ArenaCategoryItemProvider
  taxonProvider?: ArenaTaxonProvider
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
  survey: ArenaSurvey
  record: ArenaRecord
  nodeDef: ArenaNodeDefCode
  nodeParent: ArenaRecordNode
  code: string
  categoryItemProvider?: ArenaCategoryItemProvider
}): Promise<string | undefined> => {
  const { survey, record, nodeDef, nodeParent, code, categoryItemProvider } = params
  const codeNodeDef = nodeDef as ArenaNodeDef<NodeDefType.code, ArenaNodeDefCodeProps>

  const categoryItemUuid = Records.getCategoryItemUuid(survey, codeNodeDef, nodeParent, code)(record)
  if (categoryItemUuid) return categoryItemUuid
  if (!categoryItemProvider) return undefined

  const categoryUuid = NodeDefs.getCategoryUuid(nodeDef)
  if (!categoryUuid) return undefined
  const codePaths = [...Records.getAncestorCodePath(survey, nodeParent, nodeDef)(record), code]
  const draft = !!record.preview
  const item = await categoryItemProvider.getItemByCodePaths({ survey, categoryUuid, codePaths, draft })
  return item?.uuid
}

const _toCode = async (params: ToNodeValueParams): Promise<ArenaRecordNodeValueCode | null> => {
  const { survey, record, nodeDef, nodeParent, valueExpr, categoryItemProvider } = params

  if (!nodeParent) return null

  // ValueExpr is the code of a category item
  const code = String(valueExpr)

  const categoryItemUuid = await _findCategoryItemUuidByCode({
    survey,
    record,
    nodeDef: nodeDef as ArenaNodeDefCode,
    nodeParent,
    code,
    categoryItemProvider,
  })

  return categoryItemUuid ? { itemUuid: categoryItemUuid } : null
}

const _toCoordinate = (params: ToNodeValueParams): ArenaPoint | null => {
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

  // `date` encodes the parsed digits as if they were UTC (see Dates.parse/parseZone), so shift by the
  // client's offset (if any) and read the result back out in UTC - never in this machine's local time zone,
  // which would otherwise silently reintroduce the server's own timezone into the result.
  const dateWithTimezoneOffset = timezoneOffset ? new Date(date.getTime() - timezoneOffset * 60000) : date
  return Dates.formatUTC(dateWithTimezoneOffset, format)
}

const findTaxonByCode = async (params: {
  survey: ArenaSurvey
  nodeDef: ArenaNodeDefTaxon
  taxonCode: string
  draft: boolean
  taxonProvider?: ArenaTaxonProvider
}) => {
  const { survey, nodeDef, taxonCode, taxonProvider, draft } = params
  const taxonomyUuid = NodeDefs.getTaxonomyUuid(nodeDef)!
  const taxon = Surveys.getTaxonByCode({ survey, taxonomyUuid, taxonCode })
  if (taxon) return taxon
  if (!taxonProvider) return null
  return taxonProvider.getTaxonByCode({ survey, taxonomyUuid, taxonCode, draft })
}

const _toTaxon = async (params: ToNodeValueParams): Promise<ArenaRecordNodeValueTaxon | null> => {
  const { survey, record, nodeDef, valueExpr, taxonProvider } = params

  // ValueExpr is the code of a taxon
  const taxonCode = String(valueExpr)

  const taxonNodeDef = nodeDef as ArenaNodeDefTaxon
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
  [NodeDefType.time]: (params: { nodeDef: ArenaNodeDef<any>; valueExpr: any; timezoneOffset?: number }) => {
    const { nodeDef, valueExpr, timezoneOffset } = params
    return _toDateTime({
      valueExpr,
      format: NodeDefs.isSecondsIncluded(nodeDef) ? DateFormats.timeWithSeconds : DateFormats.timeStorage,
      formatsFrom: [
        DateFormats.datetimeStorage,
        DateFormats.datetimeDefault,
        DateFormats.timeWithSeconds,
        DateFormats.timeStorage,
      ],
      timezoneOffset,
    })
  },
}

const toNodeValue = (params: ToNodeValueParams): Promise<any> => {
  const { nodeDef, valueExpr } = params
  if (Objects.isEmpty(valueExpr)) return Promise.resolve(null)

  const fn = _valueExprToValueNodeFns[NodeDefs.getType(nodeDef)]
  return Promise.resolve(fn?.(params))
}

export const RecordExpressionValueConverter = {
  toNodeValue,
}
