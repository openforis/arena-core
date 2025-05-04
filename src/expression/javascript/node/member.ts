import { ExpressionContext } from '../../context'
import { ExpressionNode, ExpressionNodeEvaluator, MemberExpression } from '../../node'

export class MemberEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, MemberExpression> {
  async evaluateComputedProperty(property: ExpressionNode<any>, objectEval: any): Promise<any> {
    // expressions like plot[1] or plot[plot_id == 1]

    const propertyEval = await this.evaluator.evaluateNode(property, {
      ...this.context,
      object: this.context.object,
    })

    if (typeof propertyEval === 'number') {
      // expressions like plot[1]
      return objectEval[propertyEval]
    }

    if (Array.isArray(objectEval)) {
      // expressions where the member property is a filter function (e.g. plot[plot_id == 1])

      const filtered = []
      for await (const objectEvalItem of objectEval) {
        if (
          await this.evaluator.evaluateNode(property, {
            ...this.context,
            object: objectEvalItem,
            evaluateToNode: false,
          })
        ) {
          filtered.push(objectEvalItem)
        }
      }
      return filtered
    } else {
      return propertyEval
    }
  }

  async evaluate(expressionNode: MemberExpression): Promise<any> {
    const { object, property, computed } = expressionNode

    const objectEval = await this.evaluator.evaluateNode(object, { ...this.context, evaluateToNode: true })
    if (!objectEval) return null

    if (computed) {
      return this.evaluateComputedProperty(property, objectEval)
    }

    const propertyEval = await this.evaluator.evaluateNode(property, {
      ...this.context,
      object: objectEval,
    })

    return propertyEval
  }
}
