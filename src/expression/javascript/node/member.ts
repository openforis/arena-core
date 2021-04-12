import { ExpressionContext } from '../../context'
import { ExpressionNodeEvaluator, MemberExpression } from '../../node'

export class MemberEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, MemberExpression> {
  async evaluate(expressionNode: MemberExpression): Promise<any> {
    const { object, property, computed } = expressionNode

    const objectEval = await this.evaluator.evaluateNode(object, { ...this.context, evaluateToNode: true })
    if (!objectEval) return null

    const propertyEval = await this.evaluator.evaluateNode(property, {
      ...this.context,
      object: computed ? this.context.object : objectEval,
    })

    return computed ? objectEval[propertyEval] : propertyEval
  }
}
