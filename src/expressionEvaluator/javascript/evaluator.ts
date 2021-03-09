import { ExpressionContext } from '../context'
import { ExpressionEvaluator } from '../evaluator'
import { ExpressionFunction } from '../function'
import { ExpressionNode, ExpressionNodeEvaluator, ExpressionNodeType } from '../node'
import jsep from './parser/jsep'

export class JavascriptExpressionEvaluator implements ExpressionEvaluator {
  functions: { [functionName: string]: ExpressionFunction }
  evaluators: { [nodeType in ExpressionNodeType]: ExpressionNodeEvaluator }

  parseExpression(expressionString: string): ExpressionNode {
    return jsep(expressionString)
  }

  evaluateString(expression: string, context: ExpressionContext): any {
    const expr = this.parseExpression(expression)
    return this.evaluate(expr, context)
  }

  evaluate(expressionNode: ExpressionNode, context: ExpressionContext): any {
    const nodeEvaluator: ExpressionNodeEvaluator = this.evaluators[expressionNode.type]
    if (!nodeEvaluator) {
      throw new Error(`Unsupported function type: ${expressionNode.type}`)
    }
    return nodeEvaluator.evaluate(expressionNode, context)
  }
}
