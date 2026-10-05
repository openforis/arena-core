import { SystemError } from '../../../error'
import { ExpressionContext } from '../../context'
import { CompoundExpression, ExpressionNodeEvaluator } from '../../node'

export class CompoundEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, CompoundExpression> {
  evaluate(): Promise<any> {
    return Promise.reject(new SystemError('expression.notSupported', { type: 'compound' }))
  }
}
