import { ExpressionNodeType, JavascriptExpressionEvaluator } from '../../expression'
import { NodeDefIdentifierEvaluator } from './node/identifier'
import { NodeDefMemberEvaluator } from './node/member'
import { NodeDefThisEvaluator } from './node/thisEvaluator'
import { nodeDefExpressionFunctions } from './functions'
import { NodeDefExpressionContext } from './context'

export class NodeDefExpressionEvaluator extends JavascriptExpressionEvaluator<NodeDefExpressionContext> {
  constructor() {
    super(nodeDefExpressionFunctions, {
      [ExpressionNodeType.Identifier]: NodeDefIdentifierEvaluator,
      [ExpressionNodeType.Member]: NodeDefMemberEvaluator,
      [ExpressionNodeType.This]: NodeDefThisEvaluator,
    })
  }

  findReferencedNodeDefUuids(expression: string, context: NodeDefExpressionContext): Set<string> {
    try {
      this.evaluate(expression, context)
      return context.referencedNodeDefUuids || new Set()
    } catch (error) {
      return new Set()
    }
  }
}
