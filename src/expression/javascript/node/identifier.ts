import { ExpressionNodeEvaluator, IdentifierExpression } from '../../node'

export class IdentifierEvaluator extends ExpressionNodeEvaluator<IdentifierExpression> {
  evaluate(): any {
    throw new Error(`identifier not supported`)
  }
}
