import { SystemError, SystemErrorKeys } from '../../../error'
import { ArenaExpressionContext } from '../../context'
import { ArenaConditionalExpression, ExpressionNodeEvaluator } from '../../node'

export class ConditionalEvaluator<C extends ArenaExpressionContext> extends ExpressionNodeEvaluator<
  C,
  ArenaConditionalExpression
> {
  evaluate(): Promise<any> {
    return Promise.reject(new SystemError(SystemErrorKeys.expression.notSupported, { type: 'conditional' }))
  }
}
