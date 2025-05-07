import { SystemError } from '../../../error'
import { ExpressionContext } from '../../context'
import { CompoundExpression, ExpressionNodeEvaluator } from '../../node'

export class CompoundEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, CompoundExpression> {
  async evaluate(): Promise<any> {
    throw new SystemError('expression.notSupported', { type: 'compound' })
  }
}
