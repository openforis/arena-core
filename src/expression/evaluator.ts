import { ExpressionContext } from './context'
import { ExpressionNode, ExpressionNodeType } from './node'

export interface ExpressionEvaluator {
  evaluate(expression: string, context: ExpressionContext): any
  evaluateNode(expression: ExpressionNode<ExpressionNodeType>, context: ExpressionContext): any
}
