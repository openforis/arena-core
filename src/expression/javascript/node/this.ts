import { SystemError } from '../../../error'
import { ExpressionContext } from '../../context'
import { ExpressionNodeEvaluator, ThisExpression } from '../../node'

export class ThisEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, ThisExpression> {
  evaluate(): Promise<any> {
    return Promise.reject(new SystemError('expression.notSupported', { type: 'this' }))
  }
}
