import { ExpressionNodeEvaluator, LiteralExpression } from '../../node'

export class LiteralEvaluator extends ExpressionNodeEvaluator<LiteralExpression> {
  evaluate(expressionNode: LiteralExpression): any {
    return expressionNode.value
  }
}
