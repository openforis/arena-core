import { ThisEvaluator } from '../../../expression/javascript/node/this'
import { RecordExpressionContext } from '../context'

export class RecordThisEvaluator extends ThisEvaluator<RecordExpressionContext> {
  evaluate(): any {
    const { nodeCurrent, evaluateToNode } = this.context

    return evaluateToNode ? nodeCurrent : nodeCurrent?.value
  }
}
