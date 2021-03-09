import { ExpressionNode } from './node'

export interface ExpressionEvaluator {
  evaluate(expression: ExpressionNode, context: any): any
}
