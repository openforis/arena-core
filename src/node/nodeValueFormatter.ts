import { ArenaCategoryItem, CategoryItems } from '../category'
import { LanguageCode } from '../language'
import { ArenaNodeDef, ArenaNodeDefCode, ArenaNodeDefDecimal, NodeDefs, NodeDefType } from '../nodeDef'
import { ArenaSurvey, Surveys } from '../survey'
import { Taxa } from '../taxonomy'
import { DateFormats, Dates, Numbers, Objects, Strings } from '../utils'
import { ArenaRecordNode } from './node'
import { RecordNodeValues } from './nodeValues'

const extractCategoryItem = (params: {
  survey: ArenaSurvey
  node?: ArenaRecordNode
  value: any
}): ArenaCategoryItem | undefined => {
  const { survey, node, value } = params

  const itemUuid = RecordNodeValues.getValueItemUuid(value)
  if (!itemUuid) return undefined

  const item = node?.refData?.categoryItem ?? Surveys.getCategoryItemByUuid({ survey, itemUuid })
  // check the validity of the reference data category item
  return item?.props && Objects.isNotEmpty(CategoryItems.getCode(item)) ? item : undefined
}

type FormatParams = {
  survey: ArenaSurvey
  cycle: string
  nodeDef: ArenaNodeDef<NodeDefType>
  node?: ArenaRecordNode
  value: any
  showLabel?: boolean
  quoteLabels?: boolean
  lang?: LanguageCode
}

const formatters: { [key in NodeDefType]?: (params: FormatParams) => any } = {
  [NodeDefType.code]: (params: FormatParams) => {
    const { survey, cycle, nodeDef, node, value, showLabel, quoteLabels, lang } = params

    if (!showLabel) {
      // item code already inside value, no need to get category item
      const itemCode = RecordNodeValues.getValueCode(value)
      if (!Objects.isEmpty(itemCode)) return itemCode
    }
    const categoryItem = extractCategoryItem({ survey, node, value })
    if (!categoryItem) return null

    if (showLabel) {
      let result
      if (NodeDefs.isCodeShown(cycle)(nodeDef as ArenaNodeDefCode)) {
        result = CategoryItems.getLabelWithCode(categoryItem, lang!)
      } else {
        result = CategoryItems.getLabel(categoryItem, lang!, true)
      }
      return quoteLabels ? Strings.quote(result) : result
    }
    return CategoryItems.getCode(categoryItem)
  },
  [NodeDefType.date]: (params: FormatParams) => {
    const { value } = params
    const dateParsed = Dates.parseISO(value)
    return Dates.format(dateParsed, DateFormats.dateDisplay)
  },
  [NodeDefType.decimal]: (params: FormatParams) => {
    const { value, nodeDef } = params
    return Numbers.formatDecimal(value, NodeDefs.getMaxNumberDecimalDigits(nodeDef as ArenaNodeDefDecimal))
  },
  [NodeDefType.integer]: (params: FormatParams) => {
    const { value } = params
    return Numbers.formatInteger(Number(value))
  },
  [NodeDefType.taxon]: (params: FormatParams) => {
    const { survey, value, showLabel } = params
    const taxonUuid = RecordNodeValues.getValueTaxonUuid(value)
    if (!taxonUuid) return null
    const taxon = Surveys.getTaxonByUuid({ survey, taxonUuid })
    if (!taxon) return null
    return showLabel ? Taxa.getScientificName(taxon) : Taxa.getCode(taxon)
  },
  [NodeDefType.text]: (params: FormatParams) => {
    const { value, quoteLabels } = params
    return quoteLabels ? Strings.quote(value) : value
  },
}

const format = (params: FormatParams) => {
  const { nodeDef, value } = params
  if (Objects.isEmpty(value)) {
    return ''
  }
  const formatter = formatters[NodeDefs.getType(nodeDef)]
  const formatValue = (v: any) => (formatter ? formatter({ ...params, value: v }) : v)

  return NodeDefs.isMultiple(nodeDef) && Array.isArray(value) ? value.map(formatValue).join(', ') : formatValue(value)
}

export const RecordNodeValueFormatter = {
  format,
}
