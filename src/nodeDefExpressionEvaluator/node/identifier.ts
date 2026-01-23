import { NodeDef, NodeDefProps, NodeDefType } from '../../nodeDef/nodeDef'
import { getNodeDefChildren, getNodeDefParent, getNodeDefSource } from '../../survey/surveys/nodeDefs'
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
    return getNodeDefParent({ survey, nodeDef: nodeDefObjectContext })
  }
  if (nodeDefObjectContext.virtual) {
    return getNodeDefSource({ survey, nodeDef: nodeDefObjectContext })
  }
  return nodeDefObjectContext
}

const findActualContextNodePath = (params: { context: NodeDefExpressionContext }): string | undefined => {
  const { context } = params
  const { object: nodeDefObjectContext, currentExpressionPath } = context

  if (!nodeDefObjectContext) return undefined

  if (NodeDefs.isAttribute(nodeDefObjectContext)) {
    return `parent(${currentExpressionPath})`
  }
  return currentExpressionPath
}

export class NodeDefIdentifierEvaluator extends IdentifierEvaluator<NodeDefExpressionContext> {
  async evaluate(expressionNode: IdentifierExpression): Promise<any> {
    const { context } = this
    const { nodeDefContext, nodeDefCurrent, selfReferenceAllowed, object: objectContext, itemsFilter } = context
    const { name: exprName } = expressionNode

    if (exprName === ExpressionVariable.CONTEXT) {
      if (nodeDefContext) {
        this.addReferencedNodeDefUuid(nodeDefContext.uuid)
      }
      return nodeDefContext
    }

    // try to find the identifier among global objects or native properties
    try {
      const identifierAsGlobalObject = await super.evaluate(expressionNode)
      return identifierAsGlobalObject
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

    const { nodeDef: referencedNodeDef, path: referencedNodePath } =
      this.findReferencedNodeDefAndNodePath(expressionNode) ?? {}
    if (referencedNodeDef) {
      if (!selfReferenceAllowed && referencedNodeDef.uuid === nodeDefCurrent?.uuid) {
        throw new SystemError(ValidatorErrorKeys.expressions.cannotUseCurrentNode, { name: exprName })
      }
      this.addReferencedNodeDefUuid(referencedNodeDef.uuid)
      this.addReferencedNodePath(referencedNodePath!)

      return referencedNodeDef
    }
    throw new SystemError('expression.identifierNotFound', {
      name: exprName,
      contextObject: objectContext?.props?.name,
    })
  }

  private addReferencedNodeDefUuid(uuid: string) {
    const { context } = this
    const { referencedNodeDefUuids = new Set() } = context
    context.referencedNodeDefUuids = referencedNodeDefUuids.add(uuid)
  }

  protected addReferencedNodePath(path: string) {
    const { context } = this
    const { referencedNodePaths = new Set() } = context
    context.referencedNodePaths = referencedNodePaths.add(path)
  }

  protected findReferencedNodeDefAndNodePath(
    expressionNode: IdentifierExpression
  ): { nodeDef: NodeDef<NodeDefType, NodeDefProps>; path: string } | undefined {
    const { context } = this
    const { survey, includeAnalysis } = context
    const { name: expressionNodeName } = expressionNode

    const queue = new Queue()
    const visitedUuids: string[] = []

    const actualContextNodeDef = findActualContextNode({ context })
    const actualContextNodePath = findActualContextNodePath({ context }) ?? 'this'
    if (actualContextNodeDef) {
      queue.enqueue({ entityDef: actualContextNodeDef, path: actualContextNodePath })
      if (NodeDefs.getName(actualContextNodeDef) === expressionNodeName) {
        return { nodeDef: actualContextNodeDef, path: actualContextNodePath }
      }
    }

    while (!queue.isEmpty()) {
      const { entityDef: currentEntityDef, path: currentEntityPath } = queue.dequeue()
      const currentEntityDefChildren = getNodeDefChildren({ survey, nodeDef: currentEntityDef, includeAnalysis })
      for (const childDef of currentEntityDefChildren) {
        const childNodePath = `${currentEntityPath}.${NodeDefs.getName(childDef)}`
        if (NodeDefs.getName(childDef) === expressionNodeName) {
          return { nodeDef: childDef, path: childNodePath }
        }
        // visit nodes inside single entities
        if (NodeDefs.isSingleEntity(childDef)) {
          queue.enqueue({ entityDef: childDef, path: childNodePath })
        }
      }

      // avoid visiting 2 times the same entity definition when traversing single entities
      if (!visitedUuids.includes(currentEntityDef.uuid)) {
        const currentEntityDefParent = getNodeDefParent({ survey, nodeDef: currentEntityDef })
        if (currentEntityDefParent) {
          const currentParentEntityPath = `parent(${currentEntityPath})`
          queue.enqueue({ entityDef: currentEntityDefParent, path: currentParentEntityPath })
        }
        visitedUuids.push(currentEntityDef.uuid)
      }
    }
    return undefined
  }
}
