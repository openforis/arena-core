import { NodeDef, NodeDefProps, NodeDefType } from '../../nodeDef/nodeDef'
import { Surveys } from '../../survey'
import { NodeDefs } from '../../nodeDef/nodeDefs'
import { Objects, Queue } from '../../utils'
import { IdentifierEvaluator } from '../../expression/javascript/node/identifier'
import { NodeDefExpressionContext } from '../context'
import { ExpressionVariable, IdentifierExpression } from '../../expression'
import { SystemError } from '../../error'
import { ValidatorErrorKeys } from '../../validation'
import { NodeNativeProperties } from './nodeDefExpressionNativeProperties'
import { NodeValues } from '../../node/nodeValues'

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
  const { survey, object: nodeDefObjectContext } = context

  if (!nodeDefObjectContext) return undefined

  if (NodeDefs.isAttribute(nodeDefObjectContext)) {
    return Surveys.getNodeDefParent({ survey, nodeDef: nodeDefObjectContext })
  }
  if (nodeDefObjectContext.virtual) {
    return Surveys.getNodeDefSource({ survey, nodeDef: nodeDefObjectContext })
  }
  return nodeDefObjectContext
}

export class NodeDefIdentifierEvaluator extends IdentifierEvaluator<NodeDefExpressionContext> {
  evaluate(expressionNode: IdentifierExpression): any {
    const { context } = this
    const {
      nodeDefContext,
      nodeDefCurrent,
      selfReferenceAllowed,
      object: objectContext,
      referencedNodeDefUuids,
      itemsFilter,
    } = context
    const { name: exprName } = expressionNode

    if (exprName === ExpressionVariable.CONTEXT) {
      return nodeDefContext
    }

    // try to find the identifier among global objects or native properties
    try {
      return super.evaluate(expressionNode)
    } catch (e) {
      // ignore it
    }

    if (itemsFilter) {
      const prop = objectContext?.props?.[exprName] || objectContext?.props?.extra?.[exprName]
      if (!Objects.isEmpty(prop)) {
        return prop
      }
    }

    // check if identifier is a native property or function (e.g. String.length or String.toUpperCase())
    if (NodeNativeProperties.hasNativeProperty({ nodeDefOrValue: objectContext, propName: exprName })) {
      return NodeNativeProperties.evalNodeDefProperty({ nodeDefOrValue: objectContext, propName: exprName })
    }

    // check if identifier is a composite attribute value prop
    if (NodeDefs.isAttribute(objectContext) && NodeValues.isValueProp({ nodeDef: objectContext, prop: exprName })) {
      return objectContext
    }

    const referencedNodeDef = this.findIdentifierAmongReachableNodeDefs(expressionNode)
    if (referencedNodeDef) {
      context.referencedNodeDefUuids = (referencedNodeDefUuids || new Set()).add(referencedNodeDef.uuid)

      if (!selfReferenceAllowed && referencedNodeDef.uuid === nodeDefCurrent?.uuid) {
        throw new SystemError(ValidatorErrorKeys.expressions.cannotUseCurrentNode, { name: exprName })
      }

      return referencedNodeDef
    }
    throw new SystemError('expression.identifierNotFound', {
      name: exprName,
      contextObject: objectContext?.props?.name,
    })
  }

  /**
   * Tries to find the specified identifier among the node defs that can be "reached" from the context node def.
   */
  protected findIdentifierAmongReachableNodeDefs(
    expressionNode: IdentifierExpression
  ): NodeDef<NodeDefType, NodeDefProps> | undefined {
    const { object: contextObject } = this.context

    if (contextObject) {
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

    const reachableNodeDefsByUuid: { [key: string]: NodeDef<any> } = {}

    const queue = new Queue()
    const visitedUuids: string[] = []

    const actualContextNode = findActualContextNode({ context })
    if (actualContextNode) {
      queue.enqueue(actualContextNode)
      reachableNodeDefsByUuid[actualContextNode.uuid] = actualContextNode
    }

    while (!queue.isEmpty()) {
      const entityDefCurrent = queue.dequeue()
      const entityDefCurrentChildren = Surveys.getNodeDefChildren({ survey, nodeDef: entityDefCurrent })
      entityDefCurrentChildren.forEach((childDef) => (reachableNodeDefsByUuid[childDef.uuid] = childDef))

      // visit nodes inside single entities
      queue.enqueueItems(entityDefCurrentChildren.filter(NodeDefs.isSingleEntity))

      // avoid visiting 2 times the same entity definition when traversing single entities
      if (!visitedUuids.includes(entityDefCurrent.uuid)) {
        const entityDefCurrentParent = Surveys.getNodeDefParent({ survey, nodeDef: entityDefCurrent })
        if (entityDefCurrentParent) {
          queue.enqueue(entityDefCurrentParent)
        }
        reachableNodeDefsByUuid[entityDefCurrent.uuid] = entityDefCurrent
        visitedUuids.push(entityDefCurrent.uuid)
      }
    }
    return Object.values(reachableNodeDefsByUuid)
  }
}
