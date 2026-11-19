import { ArenaSurvey, Surveys } from '../../survey'
import { ArenaNodeDef, NodeDefType } from '../../nodeDef'
import { ArenaRecordNode } from '../../node'
import { RecordNodeValues } from '../../node/nodeValues'
import { Dates, Objects } from '../../utils'
import { ArenaCategoryItem } from '../../category'
import { ArenaTaxon } from '../../taxonomy'

interface ExtractorParams {
  survey: ArenaSurvey
  node: ArenaRecordNode
}

type Extractor = (params: ExtractorParams) => any

const extractCategoryItem = (params: ExtractorParams): ArenaCategoryItem | undefined => {
  const { survey, node } = params
  const item = node.refData?.categoryItem
  if (item) return item
  const itemUuid = RecordNodeValues.getItemUuid(node)
  return itemUuid ? Surveys.getCategoryItemByUuid({ survey, itemUuid }) : undefined
}

const extractTaxon = (params: ExtractorParams): ArenaTaxon | undefined => {
  const { survey, node } = params
  const taxon = node.refData?.taxon
  if (taxon) return taxon
  const taxonUuid = RecordNodeValues.getTaxonUuid(node)
  return taxonUuid ? Surveys.getTaxonByUuid({ survey, taxonUuid }) : undefined
}

const extractorsByNodeDefType: { [key in NodeDefType]?: Extractor } = {
  [NodeDefType.boolean]: (params: ExtractorParams) => {
    const { node } = params
    return node.value === 'true'
  },
  [NodeDefType.code]: (params: ExtractorParams) => {
    const item = extractCategoryItem(params)
    return item ? item.props.code : null
  },
  [NodeDefType.coordinate]: (params: ExtractorParams) => params.node.value,
  [NodeDefType.date]: (params: ExtractorParams) => {
    const { node } = params
    const [year, month, day] = [
      RecordNodeValues.getDateYear(node),
      RecordNodeValues.getDateMonth(node),
      RecordNodeValues.getDateDay(node),
    ]
    if (Dates.isValidDate(year, month, day)) {
      return node.value
    }
    return null
  },
  [NodeDefType.decimal]: (params: ExtractorParams) => {
    const { node } = params
    return Number(node.value)
  },
  [NodeDefType.entity]: (_params: ExtractorParams) => null,
  [NodeDefType.file]: (params: ExtractorParams) => params.node.value,
  [NodeDefType.integer]: (params: ExtractorParams) => {
    const { node } = params
    return Number(node.value)
  },
  [NodeDefType.taxon]: (params: ExtractorParams) => {
    const taxon = extractTaxon(params)
    return taxon ? taxon.props.code : null
  },
  [NodeDefType.text]: (params: ExtractorParams) => params.node.value,
  [NodeDefType.time]: (params: ExtractorParams) => {
    const { node } = params
    const [hour, minute, seconds] = [
      RecordNodeValues.getTimeHour(node),
      RecordNodeValues.getTimeMinute(node),
      RecordNodeValues.getTimeSeconds(node),
    ]
    if (Dates.isValidTime(hour, minute, seconds)) {
      return node.value
    }
    return null
  },
}

const getNodeValue = (params: { survey: ArenaSurvey; node: ArenaRecordNode; nodeDef: ArenaNodeDef<any> }) => {
  const { node, nodeDef, survey } = params

  if (Objects.isEmpty(node.value)) {
    return null
  }
  const extractor = extractorsByNodeDefType[nodeDef.type as NodeDefType]
  return extractor?.({ survey, node })
}

export const NodeValueExtractor = {
  getNodeValue,
}
