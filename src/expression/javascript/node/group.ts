import { ExpressionNodeEvaluator, GroupExpression } from '../../node'

export class GroupEvaluator extends ExpressionNodeEvaluator<GroupExpression> {
  evaluate(expressionNode: GroupExpression): any {
    const { argument } = expressionNode
    return this.evaluator.evaluateNode(argument, this.context)
  }
}
