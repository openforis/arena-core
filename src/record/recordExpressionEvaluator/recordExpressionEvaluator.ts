import { ExpressionNodeContext, ExpressionNodeType, JavascriptExpressionEvaluator } from '../../expression'
import { RecordIdentifierEvaluator } from './node/identifier'
import { recordExpressionFunctions } from './functions'
import { RecordExpressionContext } from './context'

export class RecordExpressionEvaluator extends JavascriptExpressionEvaluator<RecordExpressionContext> {
  context: RecordExpressionContext

  constructor(context: RecordExpressionContext) {
    super(recordExpressionFunctions(context), {
      [ExpressionNodeType.Identifier]: RecordIdentifierEvaluator,
    })
    this.context = context
  }

  protected getEvaluateContext(): ExpressionNodeContext {
    return { object: this.context.nodeContext }
  }
}
