import { IdentifierExpression } from '../../../../expression'
import { IdentifierEvaluator } from '../../../../expression/javascript/node/identifier'
import { Node } from '../../../../node'
import { NodeDef, NodeDefType } from '../../../../nodeDef'
import { Records } from '../../../records'
import { NodeValues } from '../../../../node/nodeValues'
import { Survey, Surveys } from '../../../../survey'
import { RecordExpressionContext } from '../../context'
import { Objects } from '../../../../utils'
import { NodesFinder } from './nodesFinder'
import { SystemError } from '../../../../error'

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
    if (referencedNodes.length === 0)
      throw new SystemError('expression.nodeNotFoundForNodeDef', { nodeDefName: propName })
    if (referencedNodes.length > 1)
      throw new SystemError('expression.multipleNodesFoundForNodeDef', { nodeDefName: propName })
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
      throw new SystemError('expression.contextObjectIsNotANode', { nodeDefName: propName })
    }

    const nodeDefContext = Surveys.getNodeDefByUuid({ survey, uuid: nodeDefContextUuid })

    // node value prop (native)
    if (value && value[propName] !== undefined) {
      return value[propName]
    }
    // node value prop (Arena specific value property)
    if (NodeValues.isValueProp({ nodeDef: nodeDefContext, prop: propName })) {
      return NodeValues.getValueProp({ nodeDef: nodeDefContext, node: nodeContext, prop: propName })
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
        throw new SystemError('expression.ancestorNotFound', {
          ancestorDefName: nodeDefReferenced.props.name || '',
          descendantDefName: nodeDefContext.props.name || '',
        })
      }
    }
    // the referenced nodes can be siblings of the current node
    const referencedNodes = NodesFinder.findDescendants({ survey, record, nodeContext, nodeDefReferenced })
    return getNodesOrValues({ survey, referencedNodes, nodeDefReferenced, propName, evaluateToNode })
  }
}
