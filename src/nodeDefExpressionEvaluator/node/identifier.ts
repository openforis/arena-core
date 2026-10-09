import { NodeDef, NodeDefProps, NodeDefType } from '../../nodeDef/nodeDef'
import { getNodeDefChildren, getNodeDefParent, getNodeDefSource } from '../../survey/surveys/nodeDefs'
import { NodeDefs } from '../../nodeDef/nodeDefs'
import { Objects, Queue } from '../../utils'
import { IdentifierEvaluator } from '../../expression/javascript/node/identifier'
import { getGlobalObjectProperty } from '../../expression/javascript/global'
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
    return getNodeDefParent({ survey, nodeDef: nodeDefObjectContext })
  }
  if (nodeDefObjectContext.virtual) {
    return getNodeDefSource({ survey, nodeDef: nodeDefObjectContext })
  }
  return nodeDefObjectContext
}

export class NodeDefIdentifierEvaluator extends IdentifierEvaluator<NodeDefExpressionContext> {
  evaluate(expressionNode: IdentifierExpression): Promise<any> {
    try {
      return Promise.resolve(this.evaluateIdentifier(expressionNode))
    } catch (error) {
      return Promise.reject(error)
    }
  }

  private evaluateIdentifier(expressionNode: IdentifierExpression): any {
    const { context } = this
    const { nodeDefContext, object: objectContext, itemsFilter, memberProperty } = context
    const { name: exprName } = expressionNode

    if (exprName === ExpressionVariable.CONTEXT) {
      if (nodeDefContext) {
        this.addReferencedNodeDefUuid(nodeDefContext.uuid)
      }
      return nodeDefContext
    }

    // global objects (e.g. Math, String)
    const globalObjectProperty = getGlobalObjectProperty(exprName, objectContext)
    if (globalObjectProperty !== null) {
      return globalObjectProperty
    }

    if (itemsFilter) {
      const prop = objectContext?.props?.[exprName] ?? objectContext?.props?.extra?.[exprName]
      if (!Objects.isEmpty(prop)) {
        return prop
      }
    }

    // check if identifier is a composite attribute value prop
    if (NodeDefs.isAttribute(objectContext) && NodeValues.isValueProp({ nodeDef: objectContext, prop: exprName })) {
      return objectContext
    }

    if (memberProperty) {
      // property of a member expression (e.g. text_attr.length or text_attr.toUpperCase()): native properties first
      const nativeProperty = this.findNativeProperty(expressionNode)
      if (nativeProperty) return nativeProperty.value
      return this.getReferencedNodeDef(expressionNode)
    }
    // identifier not in a member expression: node defs first, so that node defs named like native properties
    // (e.g. "name", "type", "trim") are always found (and registered as dependencies)
    const referencedNodeDef = this.findReferencedNodeDef(expressionNode)
    if (referencedNodeDef) return referencedNodeDef

    const nativeProperty = this.findNativeProperty(expressionNode)
    if (nativeProperty) return nativeProperty.value

    return this.throwIdentifierNotFound(expressionNode)
  }

  /**
   * Finds the identifier among the native properties or functions of the context object
   * (e.g. String.length or String.toUpperCase()).
   */
  private findNativeProperty(expressionNode: IdentifierExpression): { value: any } | null {
    const { object: objectContext } = this.context
    const { name: exprName } = expressionNode

    const globalOrNativeProperty = this.findGlobalOrNativeProperty(expressionNode)
    if (globalOrNativeProperty) {
      return globalOrNativeProperty
    }
    if (NodeNativeProperties.hasNativeProperty({ nodeDefOrValue: objectContext, propName: exprName })) {
      return {
        value: NodeNativeProperties.evalNodeDefProperty({ nodeDefOrValue: objectContext, propName: exprName }),
      }
    }
    return null
  }

  private findReferencedNodeDef(expressionNode: IdentifierExpression): NodeDef<NodeDefType, NodeDefProps> | undefined {
    const { nodeDefCurrent, selfReferenceAllowed } = this.context
    const referencedNodeDef = this.findIdentifierAmongReachableNodeDefs(expressionNode)
    if (!referencedNodeDef) return undefined

    if (!selfReferenceAllowed && referencedNodeDef.uuid === nodeDefCurrent?.uuid) {
      throw new SystemError(ValidatorErrorKeys.expressions.cannotUseCurrentNode, { name: expressionNode.name })
    }
    this.addReferencedNodeDefUuid(referencedNodeDef.uuid)
    return referencedNodeDef
  }

  private getReferencedNodeDef(expressionNode: IdentifierExpression): NodeDef<NodeDefType, NodeDefProps> {
    return this.findReferencedNodeDef(expressionNode) ?? this.throwIdentifierNotFound(expressionNode)
  }

  private throwIdentifierNotFound(expressionNode: IdentifierExpression): never {
    throw new SystemError('expression.identifierNotFound', {
      name: expressionNode.name,
      contextObject: this.context.object?.props?.name,
    })
  }

  private addReferencedNodeDefUuid(uuid: string) {
    const { context } = this
    const { referencedNodeDefUuids = new Set() } = context
    context.referencedNodeDefUuids = referencedNodeDefUuids.add(uuid)
  }

  /**
   * Tries to find the specified identifier among the node defs that can be "reached" from the context node def.
   */
  protected findIdentifierAmongReachableNodeDefs(
    expressionNode: IdentifierExpression
  ): NodeDef<NodeDefType, NodeDefProps> | undefined {
    const { object: contextObject } = this.context

    if (!contextObject) return undefined

    // stop at the first match (same order as getReachableNodeDefs), without visiting all the reachable node defs
    for (const reachableNodeDef of this.iterateReachableNodeDefs()) {
      if (reachableNodeDef.props.name === expressionNode.name) {
        return reachableNodeDef
      }
    }
    return undefined
  }

  /**
   * Get reachable node defs, i.e. the children of the node definition's ancestors.
   * NOTE: The root node def is excluded, but it _should_ be an entity, so that is fine.
   */
  protected getReachableNodeDefs(): NodeDef<NodeDefType, NodeDefProps>[] {
    return Array.from(this.iterateReachableNodeDefs())
  }

  /**
   * Iterates over the reachable node defs (see getReachableNodeDefs), yielding every node def only once.
   */
  private *iterateReachableNodeDefs(): Generator<NodeDef<NodeDefType, NodeDefProps>> {
    const { context } = this
    const { survey, includeAnalysis } = context

    const reachableNodeDefUuids = new Set<string>()
    const visitedUuids = new Set<string>()

    const queue = new Queue()

    const actualContextNode = findActualContextNode({ context })
    if (actualContextNode) {
      queue.enqueue(actualContextNode)
      reachableNodeDefUuids.add(actualContextNode.uuid)
      yield actualContextNode
    }

    while (!queue.isEmpty()) {
      const entityDefCurrent = queue.dequeue()
      const entityDefCurrentChildren = getNodeDefChildren({ survey, nodeDef: entityDefCurrent, includeAnalysis })
      for (const childDef of entityDefCurrentChildren) {
        if (!reachableNodeDefUuids.has(childDef.uuid)) {
          reachableNodeDefUuids.add(childDef.uuid)
          yield childDef
        }
      }
      // visit nodes inside single entities
      queue.enqueueItems(entityDefCurrentChildren.filter(NodeDefs.isSingleEntity))

      // avoid visiting 2 times the same entity definition when traversing single entities
      if (!visitedUuids.has(entityDefCurrent.uuid)) {
        const entityDefCurrentParent = getNodeDefParent({ survey, nodeDef: entityDefCurrent })
        if (entityDefCurrentParent) {
          queue.enqueue(entityDefCurrentParent)
        }
        if (!reachableNodeDefUuids.has(entityDefCurrent.uuid)) {
          reachableNodeDefUuids.add(entityDefCurrent.uuid)
          yield entityDefCurrent
        }
        visitedUuids.add(entityDefCurrent.uuid)
      }
    }
  }
}
