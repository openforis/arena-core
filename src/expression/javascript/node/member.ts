import { ExpressionContext } from '../../context'
import { ExpressionNode, ExpressionNodeEvaluator, MemberExpression } from '../../node'

export class MemberEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, MemberExpression> {
  evaluateComputedProperty(property: ExpressionNode<any>, objectEval: any): any {
    // expressions like plot[1] or plot[plot_id == 1]

    const propertyEval = this.evaluator.evaluateNode(property, {
      ...this.context,
      object: this.context.object,
    })

    if (typeof propertyEval === 'number') {
      // expressions like plot[1]
      return objectEval[propertyEval]
    }

    if (Array.isArray(objectEval)) {
      // expressions where the member property is a filter function (e.g. plot[plot_id == 1])

      return objectEval.filter((objectEvalItem) =>
        this.evaluator.evaluateNode(property, {
          ...this.context,
          object: objectEvalItem,
          evaluateToNode: false,
        })
      )
    } else {
      return propertyEval
    }
  }

  evaluate(expressionNode: MemberExpression): any {
    const { object, property, computed } = expressionNode

    const objectEval = this.evaluator.evaluateNode(object, { ...this.context, evaluateToNode: true })
    if (!objectEval) return null

    if (computed) {
      return this.evaluateComputedProperty(property, objectEval)
    }

    const propertyEval = this.evaluator.evaluateNode(property, {
      ...this.context,
      object: objectEval,
    })

    return propertyEval
  }
}
