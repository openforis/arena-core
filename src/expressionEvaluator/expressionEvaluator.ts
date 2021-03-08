import { IExpressionEvaluator } from './iExpressionEvaluator'
import { ExpressionNodeEvaluator } from './expressionNodeEvaluator'
import { ExpressionNodeType } from './expressionNodeType'
import { ExpressionFunction } from './expressionFunction'
import { ExpressionContext } from './expressionContext'
import { JSExpr } from './jsExpr'
import jsep from './jsep'

export class ExpressionEvaluator implements IExpressionEvaluator {
  functions: { [functionName: string]: ExpressionFunction }
  evaluators: { [nodeType in ExpressionNodeType]: ExpressionNodeEvaluator }

  parseExpression(expressionString: string): JSExpr {
    return jsep(expressionString)
  }

  evaluateString(expression: string, context: ExpressionContext): any {
    const expr = this.parseExpression(expression)
    return this.evaluate(expr, context)
  }

  evaluate(expr: JSExpr, context: ExpressionContext): any {
    const { type: exprType } = expr
    const nodeEvaluator: ExpressionNodeEvaluator = this.evaluators[exprType]
    if (!nodeEvaluator) {
      throw new Error(`Unsupported function type: ${exprType}`)
    }
    return nodeEvaluator.evaluate(expr, context)
  }
}
