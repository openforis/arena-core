import { SystemError, SystemErrorKeys } from '../../../error'
import { ArenaExpressionContext } from '../../context'
import { ArenaArrayExpression, ExpressionNodeEvaluator } from '../../node'

export class ArrayEvaluator<C extends ArenaExpressionContext> extends ExpressionNodeEvaluator<C, ArenaArrayExpression> {
  evaluate(): Promise<any> {
    return Promise.reject(new SystemError(SystemErrorKeys.expression.notSupported, { type: 'array' }))
  }
}
