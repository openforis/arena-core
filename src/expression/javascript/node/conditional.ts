import { ExpressionContext } from '../../context'
import { ConditionalExpression, ExpressionNodeEvaluator } from '../../node'

export class ConditionalEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<
  C,
  ConditionalExpression
> {
  evaluate(): any {
    throw new Error('conditional expression not supported')
  }
}
