import { ArenaExpressionContext } from '../../context'
import { ExpressionNodeEvaluator, ArenaSequenceExpression } from '../../node'

export class SequenceEvaluator<C extends ArenaExpressionContext> extends ExpressionNodeEvaluator<
  C,
  ArenaSequenceExpression
> {
  async evaluate(expressionNode: ArenaSequenceExpression): Promise<any> {
    const { expression } = expressionNode
    return this.evaluator.evaluateNode(expression, this.context)
  }
}
