import { Survey, Surveys } from '../../survey'
import { NodeDef, NodeDefType } from '../../nodeDef'
import { Node } from '../../node'
import { NodeValues } from '../../node/nodeValues'
import { Dates, Objects } from '../../utils'

interface ExtractorParams {
  survey: Survey
  node: Node
}

type Extractor = (params: ExtractorParams) => any

const extractorsByNodeDefType: { [key in NodeDefType]: Extractor } = {
  [NodeDefType.boolean]: (params: ExtractorParams) => {
    const { node } = params
    return node.value === 'true'
  },
  [NodeDefType.code]: (params: ExtractorParams) => {
    const { survey, node } = params
    const itemUuid = NodeValues.getItemUuid(node)
    const item = itemUuid ? Surveys.getCategoryItemByUuid({ survey, itemUuid }) : null
    return item ? item.props.code : null
  },
  [NodeDefType.coordinate]: (params: ExtractorParams) => params.node.value,
  [NodeDefType.date]: (params: ExtractorParams) => {
    const { node } = params
    const [year, month, day] = [
      NodeValues.getDateYear(node),
      NodeValues.getDateMonth(node),
      NodeValues.getDateDay(node),
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
    const { survey, node } = params
    const taxonUuid = NodeValues.getTaxonUuid(node)
    const taxon = taxonUuid ? Surveys.getTaxonByUuid({ survey, taxonUuid }) : null
    return taxon ? taxon.props.code : null
  },
  [NodeDefType.text]: (params: ExtractorParams) => params.node.value,
  [NodeDefType.time]: (params: ExtractorParams) => {
    const { node } = params
    const [hour, minute] = [NodeValues.getTimeHour(node), NodeValues.getTimeMinute(node)]
    if (Dates.isValidTime(hour, minute)) {
      return node.value
    }
    return null
  },
}

const getNodeValue = (params: { survey: Survey; node: Node; nodeDef: NodeDef<any> }) => {
  const { node, nodeDef, survey } = params

  if (Objects.isEmpty(node.value)) {
    return null
  }
  const extractor = extractorsByNodeDefType[nodeDef.type as NodeDefType]
  return extractor({ survey, node })
}

export const NodeValueExtractor = {
  getNodeValue,
}
