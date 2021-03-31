import { ExpressionContext } from '../../context'
import { ExpressionNodeEvaluator, LiteralExpression } from '../../node'

export class LiteralEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, LiteralExpression> {
  evaluate(expressionNode: LiteralExpression): any {
    return expressionNode.value
  }
}
