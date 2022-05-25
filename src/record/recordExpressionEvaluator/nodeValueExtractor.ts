import { Survey, Surveys } from '../../survey'
import { NodeDef, NodeDefType } from '../../nodeDef'
import { Node } from '../../node'
import { NodeValues } from '../../node/nodeValues'
import { Objects } from '../../utils'

const getNodeValue = (params: { survey: Survey; node: Node; nodeDef: NodeDef<any> }) => {
  const { node, nodeDef, survey } = params

  const value = node.value
  if (Objects.isEmpty(value)) {
    return null
  }

  if (nodeDef.type === NodeDefType.code) {
    const itemUuid = NodeValues.getItemUuid(node)
    const item = itemUuid ? Surveys.getCategoryItemByUuid({ survey, itemUuid }) : null
    return item ? item.props.code : null
  }

  if (nodeDef.type === NodeDefType.taxon) {
    const taxonUuid = NodeValues.getTaxonUuid(node)
    const taxon = taxonUuid ? Surveys.getTaxonByUuid({ survey, taxonUuid }) : null
    return taxon ? taxon.props.code : null
  }

  switch (nodeDef.type) {
    case NodeDefType.decimal:
    case NodeDefType.integer:
      return Number(value)
    case NodeDefType.boolean:
      return value === 'true'
    default:
      return value
  }
}

export const NodeValueExtractor = {
  getNodeValue,
}
