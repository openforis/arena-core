import { IdentifierExpression } from '../../../../expression'
import { IdentifierEvaluator } from '../../../../expression/javascript/node/identifier'
import { Node } from '../../../../node'
import { NodeDef, NodeDefType } from '../../../../nodeDef'
import { Records } from '../../../records'
import { Survey, Surveys } from '../../../../survey'
import { RecordExpressionContext } from '../../context'
import { Objects } from '../../../../utils'
import { RecordNodesFinder } from './recordNodesFinder'

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
    const { evaluateToNode, object: nodeContext } = this.context
    const evaluatorContext: RecordExpressionContext = this.evaluator.context
    const { survey, record } = evaluatorContext

    const nodeDefUuid = nodeContext.nodeDefUuid
    if (nodeDefUuid) {
      const nodeDefContext = Surveys.getNodeDefByUuid({ survey, uuid: nodeContext.nodeDefUuid })

      // node value prop
      const value = nodeContext.value
      if (value && Object.prototype.hasOwnProperty.call(value, propName)) {
        return value[propName]
      }

      const nodeDefReferenced = Surveys.getNodeDefByName({ survey, name: propName })

      // referenced node
      let nodeResult = null
      if (nodeContext.nodeDefUuid === nodeDefReferenced.uuid) {
        // the referenced node is the current node itself
        nodeResult = nodeContext
      } else if (
        Surveys.isNodeDefAncestor({ survey, nodeDefAncestor: nodeDefContext, nodeDefDescendant: nodeDefReferenced })
      ) {
        // if the rerenced node name is an ancestor of the current node, return it following the hierarchy
        nodeResult = Records.getAncestor({ record, node: nodeContext, ancestorDefUuid: nodeDefReferenced.uuid })
      }
      if (nodeResult) {
        return evaluateToNode || nodeDefContext.type === NodeDefType.entity
          ? nodeResult
          : getNodeValue({ survey, node: nodeResult, nodeDef: nodeDefContext })
      }

      // the referenced nodes can be siblings of the current node
      const referencedNodes = RecordNodesFinder.findDescendantNodes({ survey, record, nodeContext, nodeDefReferenced })

      const single = !nodeDefReferenced.props.multiple
      if (single && (referencedNodes.length === 0 || referencedNodes.length > 1)) {
        throw new Error(`Cannot find node definition with name ${propName}`)
      }

      if (nodeDefReferenced.type !== NodeDefType.entity && !evaluateToNode) {
        // return node values
        const values = referencedNodes.map((referencedNode) =>
          getNodeValue({ survey, node: referencedNode, nodeDef: nodeDefReferenced })
        )
        return single ? values[0] : values
      }
      // return nodes
      return single ? referencedNodes[0] : referencedNodes
    }
    throw new Error(`Cannot find node with name ${propName}`)
  }
}
