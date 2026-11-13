import { SystemError, SystemErrorKeys } from '../../../error'
import { ExpressionContext } from '../../context'
import { ExpressionNodeEvaluator, LiteralExpression } from '../../node'
import { isUnsafeRegExpSource } from '../regExpSafety'

export class LiteralEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, LiteralExpression> {
  evaluate(expressionNode: LiteralExpression): Promise<any> {
    const { value } = expressionNode
    if (value instanceof RegExp && isUnsafeRegExpSource(value.source)) {
      return Promise.reject(
        new SystemError(SystemErrorKeys.expression.unsafeRegularExpression, { pattern: value.source })
      )
    }
    return Promise.resolve(value)
  }
}
