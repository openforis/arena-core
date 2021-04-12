import { ExpressionContext } from '../../context'
import { ExpressionNodeEvaluator, LiteralExpression } from '../../node'

export class LiteralEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, LiteralExpression> {
  async evaluate(expressionNode: LiteralExpression): Promise<any> {
    return expressionNode.value
  }
}
