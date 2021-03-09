import { ExpressionNodeEvaluator, ExpressionNodeType, MemberExpression } from '../../node'

export class MemberEvaluator extends ExpressionNodeEvaluator<MemberExpression> {
  evaluate(expressionNode: MemberExpression): any {
    const { object, property } = expressionNode

    const objectEval = this.evaluator.evaluateNode(object, this.context)
    if (!objectEval) return null

    const propertyEval = this.evaluator.evaluateNode(property, { ...this.context, node: objectEval })

    if (
      propertyEval.constructor === Array &&
      property.type === ExpressionNodeType.Literal &&
      objectEval.length > propertyEval
    ) {
      // @ts-ignore
      return objectEval[propertyEval]
    }

    return propertyEval
  }
}
