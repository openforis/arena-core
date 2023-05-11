import { CategoryItems } from '../category'
import { LanguageCode } from '../language'
import { NodeDef, NodeDefDecimal, NodeDefs, NodeDefType } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { Taxa } from '../taxonomy'
import { DateFormats, Dates, Numbers, Objects } from '../utils'
import { NodeValues } from './nodeValues'

const formatters: { [key in NodeDefType]?: any } = {
  [NodeDefType.code]: (params: { survey: Survey; value: any; showLabel: boolean; lang: LanguageCode }) => {
    const { survey, value, showLabel, lang } = params
    const itemUuid = NodeValues.getValueItemUuid(value)
    if (!itemUuid) return null
    const categoryItem = Surveys.getCategoryItemByUuid({ survey, itemUuid })
    if (!categoryItem) return null
    return showLabel ? CategoryItems.getLabelOrCode(categoryItem, lang) : CategoryItems.getCode(categoryItem)
  },
  [NodeDefType.date]: (params: { value: any }) => {
    const { value } = params
    return Dates.format(Dates.parseISO(value), DateFormats.dateDisplay)
  },
  [NodeDefType.decimal]: (params: { value: any; nodeDef: NodeDefDecimal }) => {
    const { value, nodeDef } = params
    return Numbers.formatDecimal(value, NodeDefs.getMaxNumberDecimalDigits(nodeDef))
  },
  [NodeDefType.integer]: (params: { value: any }) => {
    const { value } = params
    return Numbers.formatInteger(Number(value))
  },
  [NodeDefType.taxon]: (params: { survey: Survey; value: any; showLabel: boolean }) => {
    const { survey, value, showLabel } = params
    const taxonUuid = NodeValues.getValueTaxonUuid(value)
    if (!taxonUuid) return null
    const taxon = Surveys.getTaxonByUuid({ survey, taxonUuid })
    if (!taxon) return null
    return showLabel ? Taxa.getScientificName(taxon) : Taxa.getCode(taxon)
  },
}

const format = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType>
  value: any
  showLabel?: boolean
  lang?: LanguageCode
}) => {
  const { survey, nodeDef, value, showLabel = false, lang } = params
  if (Objects.isEmpty(value)) {
    return ''
  }
  const formatter = formatters[NodeDefs.getType(nodeDef)]
  const formatValue = (v: any) => (formatter ? formatter({ survey, nodeDef, value: v, showLabel, lang }) : value)

  return NodeDefs.isMultiple(nodeDef) && Array.isArray(value) ? value.map(formatValue).join(', ') : formatValue(value)
}

export const NodeValueFormatter = {
  format,
}
