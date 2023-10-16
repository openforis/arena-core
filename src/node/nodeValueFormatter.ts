import { CategoryItem, CategoryItems } from '../category'
import { LanguageCode } from '../language'
import { NodeDef, NodeDefCode, NodeDefDecimal, NodeDefs, NodeDefType } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { Taxa } from '../taxonomy'
import { DateFormats, Dates, Numbers, Objects, Strings } from '../utils'
import { Node } from './node'
import { NodeValues } from './nodeValues'

const extractCategoryItem = (params: { survey: Survey; node?: Node; value: any }): CategoryItem | undefined => {
  const { survey, node, value } = params

  const itemUuid = NodeValues.getValueItemUuid(value)
  if (!itemUuid) return undefined

  return node?.refData?.categoryItem ?? Surveys.getCategoryItemByUuid({ survey, itemUuid })
}

type FormatParams = {
  survey: Survey
  cycle: string
  nodeDef: NodeDef<NodeDefType>
  node?: Node
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
      const itemCode = NodeValues.getValueCode(value)
      if (!Objects.isEmpty(itemCode)) return itemCode
    }
    const categoryItem = extractCategoryItem({ survey, node, value })
    if (!categoryItem) return null

    if (showLabel) {
      let result
      if (NodeDefs.isCodeShown(cycle)(nodeDef as NodeDefCode)) {
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
    return Dates.format(Dates.parseISO(value), DateFormats.dateDisplay)
  },
  [NodeDefType.decimal]: (params: FormatParams) => {
    const { value, nodeDef } = params
    return Numbers.formatDecimal(value, NodeDefs.getMaxNumberDecimalDigits(nodeDef as NodeDefDecimal))
  },
  [NodeDefType.integer]: (params: FormatParams) => {
    const { value } = params
    return Numbers.formatInteger(Number(value))
  },
  [NodeDefType.taxon]: (params: FormatParams) => {
    const { survey, value, showLabel } = params
    const taxonUuid = NodeValues.getValueTaxonUuid(value)
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
  const formatValue = (v: any) => (formatter ? formatter(params) : v)

  return NodeDefs.isMultiple(nodeDef) && Array.isArray(value) ? value.map(formatValue).join(', ') : formatValue(value)
}

export const NodeValueFormatter = {
  format,
}
