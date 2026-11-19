import { SystemError, SystemErrorKeys } from '../../../error'
import { ArenaExpressionContext } from '../../context'
import { ExpressionNodeEvaluator, ArenaLiteralExpression } from '../../node'
import { isUnsafeRegExpSource } from '../regExpSafety'

export class LiteralEvaluator<C extends ArenaExpressionContext> extends ExpressionNodeEvaluator<
  C,
  ArenaLiteralExpression
> {
  evaluate(expressionNode: ArenaLiteralExpression): Promise<any> {
    const { value } = expressionNode
    if (value instanceof RegExp && isUnsafeRegExpSource(value.source)) {
      return Promise.reject(
        new SystemError(SystemErrorKeys.expression.unsafeRegularExpression, { pattern: value.source })
      )
    }
    return Promise.resolve(value)
  }
}
