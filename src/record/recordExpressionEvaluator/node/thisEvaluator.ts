import { ThisEvaluator } from '../../../expression/javascript/node/this'
import { RecordExpressionContext } from '../context'
import { NodeValueExtractor } from '../nodeValueExtractor'
import { Surveys } from '../../../survey'

export class RecordThisEvaluator extends ThisEvaluator<RecordExpressionContext> {
  evaluate(): any {
    const { survey, nodeCurrent, evaluateToNode, item } = this.context

    if (evaluateToNode) {
      return item ?? nodeCurrent
    }

    if (item) {
      return item?.props?.code
    }

    if (nodeCurrent?.nodeDefUuid) {
      const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeCurrent?.nodeDefUuid })
      return NodeValueExtractor.getNodeValue({ survey, node: nodeCurrent, nodeDef })
    }
    return undefined
  }
}
