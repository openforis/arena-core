import { SystemError } from '../../../error'
import { ExpressionContext } from '../../context'
import { ConditionalExpression, ExpressionNodeEvaluator } from '../../node'

export class ConditionalEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<
  C,
  ConditionalExpression
> {
  async evaluate(): Promise<any> {
    throw new SystemError('expression.notSupported', { type: 'conditional' })
  }
}
