import { SystemError, SystemErrorKeys } from '../../../error'
import { ArenaExpressionContext } from '../../context'
import { ArenaCompoundExpression, ExpressionNodeEvaluator } from '../../node'

export class CompoundEvaluator<C extends ArenaExpressionContext> extends ExpressionNodeEvaluator<
  C,
  ArenaCompoundExpression
> {
  evaluate(): Promise<any> {
    return Promise.reject(new SystemError(SystemErrorKeys.expression.notSupported, { type: 'compound' }))
  }
}
