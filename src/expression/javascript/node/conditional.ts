import { SystemError, SystemErrorKeys } from '../../../error'
import { ExpressionContext } from '../../context'
import { ConditionalExpression, ExpressionNodeEvaluator } from '../../node'

export class ConditionalEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<
  C,
  ConditionalExpression
> {
  evaluate(): Promise<any> {
    return Promise.reject(new SystemError(SystemErrorKeys.expression.notSupported, { type: 'conditional' }))
  }
}
