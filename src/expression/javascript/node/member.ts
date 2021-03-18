import { ExpressionContext } from '../../context'
import { ExpressionNodeEvaluator, MemberExpression } from '../../node'

export class MemberEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, MemberExpression> {
  evaluate(expressionNode: MemberExpression): any {
    const { object, property, computed } = expressionNode

    const objectEval = this.evaluator.evaluateNode(object, this.context)
    if (!objectEval) return null

    const propertyEval = this.evaluator.evaluateNode(property, {
      ...this.context,
      object: computed ? this.context.object : objectEval,
    })

    return computed ? objectEval[propertyEval] : propertyEval
  }
}
