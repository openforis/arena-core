import { MemberExpression } from '../../../expression'
import { MemberEvaluator } from '../../../expression/javascript/node/member'
import { NodeDefExpressionContext } from '../context'

const isNodeDef = (obj: any) => 'uuid' in obj

export class NodeDefMemberEvaluator extends MemberEvaluator<NodeDefExpressionContext> {
  evaluate(expressionNode: MemberExpression): any {
    const { object, property, computed } = expressionNode

    const objectEval = this.evaluator.evaluateNode(object, this.context)
    if (objectEval === null) {
      return null
    }
    if (computed) {
      // access element at index (e.g. plot[1] or plot[index(...)])
      return objectEval
    }
    // eval property and return it (e.g. plot.plot_id)
    // allow self node def reference because the referenced node at runtime can be different from current node
    // e.g. current node = plot_id ; expression = parent(plot).plot[index(plot) - 1].plot_id

    const propertyNodeDefContext = isNodeDef(objectEval) ? objectEval : this.context.nodeDefContext

    return this.evaluator.evaluateNode(property, {
      ...this.context,
      object: objectEval,
      nodeDefContext: propertyNodeDefContext,
      selfReferenceAllowed: true,
    })
  }
}
