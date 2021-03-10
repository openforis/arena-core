import { ExpressionNodeEvaluator, ThisExpression } from '../../node'

export class ThisEvaluator extends ExpressionNodeEvaluator<ThisExpression> {
  evaluate(): any {
    throw new Error(`this not supported`)
  }
}
