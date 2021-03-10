import { ExpressionNodeEvaluator, MemberExpression } from '../../node'

export class MemberEvaluator extends ExpressionNodeEvaluator<MemberExpression> {
  evaluate(expressionNode: MemberExpression): any {
    const { object, property, computed } = expressionNode

    const objectEval = this.evaluator.evaluateNode(object, this.context)
    if (!objectEval) return null

    const propertyEval = this.evaluator.evaluateNode(property, {
      ...this.context,
      expressionNode: computed ? this.context.expressionNode : objectEval,
    })

    return computed ? objectEval[propertyEval] : propertyEval
  }
}