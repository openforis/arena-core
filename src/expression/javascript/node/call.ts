import { CallExpression, ExpressionNodeEvaluator, ExpressionNodeType } from '../../node'

export class CallEvaluator extends ExpressionNodeEvaluator<CallExpression> {
  evaluate(expressionNode: CallExpression): any {
    const { callee } = expressionNode

    if (callee.type === ExpressionNodeType.Member) {
      return this.evaluator.evaluateNode({ ...expressionNode, type: ExpressionNodeType.Member }, this.context)
    } else if (callee.type === ExpressionNodeType.Identifier) {
      return this.evaluator.evaluateNode({ ...expressionNode, type: ExpressionNodeType.Identifier }, this.context)
    }

    // No complex expressions may be put in place of a function body.
    // Only a plain identifier is allowed.
    throw new Error(`invalidSyntax ${callee.type}`)
  }
}
