import { SystemError, SystemErrorKeys } from '../../../error'
import { ArenaExpressionContext } from '../../context'
import { ExpressionNodeEvaluator, ArenaThisExpression } from '../../node'

export class ThisEvaluator<C extends ArenaExpressionContext> extends ExpressionNodeEvaluator<C, ArenaThisExpression> {
  evaluate(): Promise<any> {
    return Promise.reject(new SystemError(SystemErrorKeys.expression.notSupported, { type: 'this' }))
  }
}
