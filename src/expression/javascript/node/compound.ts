import { ExpressionContext } from '../../context'
import { CompoundExpression, ExpressionNodeEvaluator } from '../../node'

export class CompoundEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, CompoundExpression> {
  evaluate(): any {
    throw new Error(`compound not supported`)
  }
}
