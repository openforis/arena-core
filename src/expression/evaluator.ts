import { ExpressionContext } from './context'
import { ExpressionFunction } from './function'
import { ExpressionNode, ExpressionNodeType } from './node'

export interface ExpressionEvaluator {
  functions: { [functionName: string]: ExpressionFunction }
  evaluate(expression: string, context: ExpressionContext): any
  evaluateNode(expression: ExpressionNode<ExpressionNodeType>, context: ExpressionContext): any
}
