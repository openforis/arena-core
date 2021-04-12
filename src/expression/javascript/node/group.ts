import { ExpressionContext } from '../../context'
import { ExpressionNodeEvaluator, GroupExpression } from '../../node'

export class GroupEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, GroupExpression> {
  async evaluate(expressionNode: GroupExpression): Promise<any> {
    const { argument } = expressionNode
    return this.evaluator.evaluateNode(argument, this.context)
  }
}
