import { ExpressionContext } from '../../context'
import { ExpressionNodeEvaluator, SequenceExpression } from '../../node'

export class SequenceEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, SequenceExpression> {
  async evaluate(expressionNode: SequenceExpression): Promise<any> {
    const { expression } = expressionNode
    return this.evaluator.evaluateNode(expression, this.context)
  }
}
