import { SystemError } from '../../../error'
import { ExpressionContext } from '../../context'
import { ArrayExpression, ExpressionNodeEvaluator } from '../../node'

export class ArrayEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, ArrayExpression> {
  async evaluate(): Promise<any> {
    throw new SystemError('expression.notSupported', { type: 'array' })
  }
}
