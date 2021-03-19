import { ExpressionNodeType, JavascriptExpressionEvaluator } from '../../expression'
import { RecordIdentifierEvaluator } from './node/identifier'
import { recordExpressionFunctions } from './functions'
import { RecordExpressionContext } from './context'

export class RecordExpressionEvaluator extends JavascriptExpressionEvaluator<RecordExpressionContext> {
  initialContext: RecordExpressionContext

  constructor(context: RecordExpressionContext) {
    super(recordExpressionFunctions(context), {
      [ExpressionNodeType.Identifier]: RecordIdentifierEvaluator,
    })
    this.initialContext = context
  }

  getEvaluateContext(): RecordExpressionContext {
    return { ...this.initialContext, object: this.initialContext.nodeContext }
  }
}
