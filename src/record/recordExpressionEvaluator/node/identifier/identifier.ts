import { IdentifierExpression } from '../../../../expression'
import { IdentifierEvaluator } from '../../../../expression/javascript/node/identifier'
import { Node } from '../../../../node'
import { NodeDef, NodeDefType } from '../../../../nodeDef'
import { Records } from '../../../records'
import { Survey, Surveys } from '../../../../survey'
import { RecordExpressionContext } from '../../context'
import { Objects } from '../../../../utils'
import { NodesFinder } from './nodesFinder'
import { NodeValue } from '../../../../node/nodeValue'

const getNodeValue = (params: { survey: Survey; node: Node; nodeDef: NodeDef<any> }) => {
  const { node, nodeDef } = params

  const value = node.value
  if (Objects.isEmpty(value)) {
    return null
  }

  //   if (NodeDef.isCode(nodeDef)) {
  //     const itemUuid = Node.getCategoryItemUuid(node)
  //     const item = itemUuid ? Survey.getCategoryItemByUuid(itemUuid)(survey) : null
  //     return item ? CategoryItem.getCode(item) : null
  //   }

  //   if (NodeDef.isTaxon(nodeDef)) {
  //     const taxonUuid = Node.getTaxonUuid(node)
  //     const taxon = taxonUuid ? Survey.getTaxonByUuid(taxonUuid)(survey) : null
  //     return taxon ? Taxon.getCode(taxon) : null
  //   }

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

const getNodesOrValues = (params: {
  survey: Survey
  referencedNodes: Node[]
  nodeDefReferenced: NodeDef<any>
  propName: string
  evaluateToNode?: boolean
}) => {
  const { survey, nodeDefReferenced, referencedNodes, propName, evaluateToNode } = params
  const single = !nodeDefReferenced.props.multiple
  if (single) {
    if (referencedNodes.length === 0) throw new Error(`Cannot find node definition with name ${propName}`)
    if (referencedNodes.length > 1) throw new Error(`Multiple nodes found for definition with name ${propName}`)
  }
  if (nodeDefReferenced.type === NodeDefType.entity || evaluateToNode) {
    // return nodes
    return single ? referencedNodes[0] : referencedNodes
  }
  // return node values
  const values = referencedNodes.map((referencedNode) =>
    getNodeValue({ survey, node: referencedNode, nodeDef: nodeDefReferenced })
  )
  return single ? values[0] : values
}

export class RecordIdentifierEvaluator extends IdentifierEvaluator<RecordExpressionContext> {
  evaluate(expressionNode: IdentifierExpression): any {
    try {
      const result = super.evaluate(expressionNode)
      return result
    } catch (e) {
      // ignore it
    }

    // identifier not found
    // identifier should be a node or a node value property
    const { name: propName } = expressionNode
    const { survey, record, evaluateToNode, object: nodeContext } = this.context

    const { nodeDefUuid: nodeDefContextUuid, value } = nodeContext
    if (!nodeDefContextUuid) {
      throw new Error(`Cannot find node with name ${propName}: context object is not a Node`)
    }

    const nodeDefContext = Surveys.getNodeDefByUuid({ survey, uuid: nodeDefContextUuid })

    // node value prop (native)
    if (value && value[propName] !== undefined) {
      return value[propName]
    }
    // node value prop (Arena specific value property)
    if (NodeValue.isValueProp({ nodeDef: nodeDefContext, prop: propName })) {
      return NodeValue.getValueProp({ nodeDef: nodeDefContext, node: nodeContext, prop: propName })
    }

    const nodeDefReferenced = Surveys.getNodeDefByName({ survey, name: propName })

    if (nodeContext.nodeDefUuid === nodeDefReferenced.uuid) {
      // the referenced node is the current node itself
      return nodeContext
    }
    if (Surveys.isNodeDefAncestor({ nodeDefAncestor: nodeDefReferenced, nodeDefDescendant: nodeDefContext })) {
      // if the rerenced node is an ancestor of the context node, return it following the hierarchy
      try {
        return Records.getAncestor({ record, node: nodeContext, ancestorDefUuid: nodeDefReferenced.uuid })
      } catch (e) {
        throw new Error(
          `Could not find ancestor with def ${nodeDefReferenced.props.name} - node def descendant: ${nodeDefContext.props.name} - ancestor h: ${nodeDefReferenced.meta.h} descendant h : ${nodeDefContext.meta.h}`
        )
      }
    }
    // the referenced nodes can be siblings of the current node
    const referencedNodes = NodesFinder.findDescendants({ survey, record, nodeContext, nodeDefReferenced })
    return getNodesOrValues({ survey, referencedNodes, nodeDefReferenced, propName, evaluateToNode })
  }
}
