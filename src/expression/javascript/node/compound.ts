import { CompoundExpression, ExpressionNodeEvaluator } from '../../node'

export class CompoundEvaluator extends ExpressionNodeEvaluator<CompoundExpression> {
  evaluate(): any {
    throw new Error(`compound not supported`)
  }
}
