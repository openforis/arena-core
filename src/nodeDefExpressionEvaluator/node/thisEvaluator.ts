import { ThisEvaluator } from '../../expression/javascript/node/this'
import { NodeDefExpressionContext } from '../context'

export class NodeDefThisEvaluator extends ThisEvaluator<NodeDefExpressionContext> {
  evaluate(): any {
    const { nodeDefCurrent, itemsFilter } = this.context

    return itemsFilter
      ? {} // empty item
      : nodeDefCurrent
  }
}
