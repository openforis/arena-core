import { ExpressionNodeType, JavascriptExpressionEvaluator } from '../../expression'
import { NodeDefIdentifierEvaluator } from './node/identifier'
import { NodeDefMemberEvaluator } from './node/member'
import { nodeDefExpressionFunctions } from './functions'
import { NodeDefExpressionContext } from './context'

export class NodeDefExpressionEvaluator extends JavascriptExpressionEvaluator<NodeDefExpressionContext> {
  constructor() {
    super(nodeDefExpressionFunctions, {
      [ExpressionNodeType.Identifier]: NodeDefIdentifierEvaluator,
      [ExpressionNodeType.Member]: NodeDefMemberEvaluator,
    })
  }
}
