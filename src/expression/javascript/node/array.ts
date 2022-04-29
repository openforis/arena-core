import { SystemError } from '../../../error'
import { ExpressionContext } from '../../context'
import { ArrayExpression, ExpressionNodeEvaluator } from '../../node'

export class ArrayEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, ArrayExpression> {
  evaluate(): any {
    throw new SystemError('expression.notSupported', { type: 'array' })
  }
}
