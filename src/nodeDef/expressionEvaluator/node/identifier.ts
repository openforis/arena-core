import { NodeDef, NodeDefType } from '../../nodeDef'
import { Survey, Surveys } from '../../../survey'
import { NodeDefs } from '../../nodeDefs'
import { Queue } from '../../../utils'
import { IdentifierEvaluator } from '../../../expression/javascript/node/identifier'
import { NodeDefExpressionContext } from '../context'
import { IdentifierExpression } from '../../../expression'
import { NodeDefProps } from '../..'

/**
 * Determines the actual context node def
 * - attribute def => parent entity def
 * - virtual entity def => source node def
 * - entity def => entity def itself
 */
const findActualContextNode = (params: { survey: Survey; nodeDefContext: NodeDef<NodeDefType> }) => {
  const { survey, nodeDefContext } = params
  if (NodeDefs.isAttribute(nodeDefContext)) {
    return Surveys.getNodeDefParent({ survey, nodeDef: nodeDefContext })
  }
  if (nodeDefContext.virtual) {
    return Surveys.getNodeDefSource({ survey, nodeDef: nodeDefContext })
  }
  return nodeDefContext
}

/**
 * Get reachable nodes, i.e. the children of the node's ancestors.
 * NOTE: The root node is excluded, but it _should_ be an entity, so that is fine.
 */
const getReachableNodeDefs = (params: {
  survey: Survey
  nodeDefContext: NodeDef<NodeDefType>
}): NodeDef<NodeDefType, NodeDefProps>[] => {
  const { survey, nodeDefContext } = params

  const reachableNodeDefs = []

  const queue = new Queue()
  const visitedUuids: string[] = []

  const actualContextNode = findActualContextNode({ survey, nodeDefContext })
  if (actualContextNode) queue.enqueue(actualContextNode)

  while (!queue.isEmpty()) {
    const entityDefCurrent = queue.dequeue()
    const entityDefCurrentChildren = Surveys.getNodeDefChildren({ survey, nodeDef: entityDefCurrent })

    reachableNodeDefs.push(entityDefCurrent, ...entityDefCurrentChildren)

    // visit nodes inside single entities
    queue.enqueueItems(entityDefCurrentChildren.filter((nd) => NodeDefs.isSingleEntity(nd)))

    // avoid visiting 2 times the same entity definition when traversing single entities
    if (!visitedUuids.includes(entityDefCurrent.uuid)) {
      const entityDefCurrentParent = Surveys.getNodeDefParent({ survey, nodeDef: entityDefCurrent })
      if (entityDefCurrentParent) {
        queue.enqueue(entityDefCurrentParent)
      }
      visitedUuids.push(entityDefCurrent.uuid)
    }
  }
  return reachableNodeDefs
}

export class NodeDefIdentifierEvaluator extends IdentifierEvaluator<NodeDefExpressionContext> {
  evaluate(expressionNode: IdentifierExpression): any {
    try {
      return super.evaluate(expressionNode)
    } catch (e) {
      // ignore it
    }

    // identifier not found
    // identifier should be a node def or a node value property

    const { survey, nodeDefContext } = this.context

    const exprName = expressionNode.name

    // identifier references a node
    if (nodeDefContext) {
      const reachableNodeDefs = getReachableNodeDefs({ survey, nodeDefContext })

      return reachableNodeDefs.find((x: NodeDef<NodeDefType, NodeDefProps>) => x.props.name === exprName)
    }

    return undefined
  }
}
