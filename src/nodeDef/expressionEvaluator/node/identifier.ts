import { NodeDef, NodeDefProps, NodeDefType } from '../../nodeDef'
import { Surveys } from '../../../survey'
import { NodeDefs } from '../../nodeDefs'
import { Queue } from '../../../utils'
import { IdentifierEvaluator } from '../../../expression/javascript/node/identifier'
import { NodeDefExpressionContext } from '../context'
import { IdentifierExpression } from '../../../expression'
import { SystemError } from '../../../error'
import { ValidatorErrorKeys } from '../../../validation'
import { PointFactory } from '../../../geo'

/**
 * Determines the actual context node def
 * - attribute def => parent entity def
 * - virtual entity def => source node def
 * - entity def => entity def itself
 */
const findActualContextNode = (params: {
  context: NodeDefExpressionContext
}): NodeDef<NodeDefType, NodeDefProps> | undefined => {
  const { context } = params
  const { survey, nodeDefContext } = context

  if (!nodeDefContext) return undefined

  if (NodeDefs.isAttribute(nodeDefContext)) {
    return Surveys.getNodeDefParent({ survey, nodeDef: nodeDefContext })
  }
  if (nodeDefContext.virtual) {
    return Surveys.getNodeDefSource({ survey, nodeDef: nodeDefContext })
  }
  return nodeDefContext
}

const sampleValuesByNodeDefType: { [key in NodeDefType]?: any } = {
  [NodeDefType.boolean]: true,
  [NodeDefType.code]: { itemUuid: '54911eda-ebdd-11ec-8ea0-0242ac120002' },
  [NodeDefType.coordinate]: PointFactory.createInstance({ x: 1, y: 2, srs: 'EPSG:4326' }),
  [NodeDefType.date]: '2022-06-14',
  [NodeDefType.decimal]: 1.234,
  [NodeDefType.integer]: 1,
  [NodeDefType.taxon]: { taxonUuid: '54911eda-ebdd-11ec-8ea0-0242ac120002' },
  [NodeDefType.text]: 'Carpe diem',
  [NodeDefType.time]: '10:25',
}

export class NodeDefIdentifierEvaluator extends IdentifierEvaluator<NodeDefExpressionContext> {
  evaluate(expressionNode: IdentifierExpression): any {
    try {
      // try to find the identifier among global objects or native properties
      return super.evaluate(expressionNode)
    } catch (e) {
      const { context } = this

      const { nodeDefCurrent, selfReferenceAllowed, referencedNodeDefUuids } = context

      const referencedNodeDef = this.findIdentifierAmongReachableNodeDefs(expressionNode)
      if (referencedNodeDef) {
        context.referencedNodeDefUuids = (referencedNodeDefUuids || new Set()).add(referencedNodeDef.uuid)

        if (!selfReferenceAllowed && referencedNodeDef.uuid === nodeDefCurrent?.uuid) {
          throw new SystemError(ValidatorErrorKeys.expressions.cannotUseCurrentNode, { name: expressionNode.name })
        }

        const result = this.getValueOrNodeDef(referencedNodeDef)
        return referencedNodeDef.props.multiple ? [result] : result
      }
      throw new SystemError('expression.identifierNotFound', { name: expressionNode.name })
    }
  }

  getValueOrNodeDef(nodeDef: NodeDef<NodeDefType, any>): any {
    const { evaluateToNode = true } = this.context
    if (evaluateToNode) return nodeDef
    return sampleValuesByNodeDefType[nodeDef.type] || null
  }

  /**
   * Tries to find the specified identifier among the node defs that can be "reached" from the context node def.
   */
  protected findIdentifierAmongReachableNodeDefs(
    expressionNode: IdentifierExpression
  ): NodeDef<NodeDefType, NodeDefProps> | undefined {
    const { nodeDefContext } = this.context

    if (nodeDefContext) {
      const reachableNodeDefs = this.getReachableNodeDefs()

      return reachableNodeDefs.find(
        (reachableNodeDef: NodeDef<NodeDefType, NodeDefProps>) => reachableNodeDef.props.name === expressionNode.name
      )
    }
    return undefined
  }
  /**
   * Get reachable node defs, i.e. the children of the node definition's ancestors.
   * NOTE: The root node def is excluded, but it _should_ be an entity, so that is fine.
   */
  protected getReachableNodeDefs(): NodeDef<NodeDefType, NodeDefProps>[] {
    const { context } = this
    const { survey } = context

    const reachableNodeDefs = []

    const queue = new Queue()
    const visitedUuids: string[] = []

    const actualContextNode = findActualContextNode({ context })
    if (actualContextNode) queue.enqueue(actualContextNode)

    while (!queue.isEmpty()) {
      const entityDefCurrent = queue.dequeue()
      const entityDefCurrentChildren = Surveys.getNodeDefChildren({ survey, nodeDef: entityDefCurrent })

      reachableNodeDefs.push(entityDefCurrent, ...entityDefCurrentChildren)

      // visit nodes inside single entities
      queue.enqueueItems(entityDefCurrentChildren.filter(NodeDefs.isSingleEntity))

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
}
