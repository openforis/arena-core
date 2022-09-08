import { ThisEvaluator } from '../../expression/javascript/node/this'
import { NodeDefExpressionContext } from '../context'

export class NodeDefThisEvaluator extends ThisEvaluator<NodeDefExpressionContext> {
  evaluate(): any {
    const { nodeDefCurrent } = this.context

    return nodeDefCurrent
  }
}
