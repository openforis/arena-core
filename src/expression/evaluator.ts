import { ExpressionContext } from './context'
import { ExpressionFunction } from './function'
import { ExpressionNode, ExpressionNodeType } from './node'

export interface ExpressionEvaluator<C extends ExpressionContext> {
  initialContext: C
  functions: { [functionName: string]: ExpressionFunction }
  evaluate(expression: string): any
  evaluateNode(expression: ExpressionNode<ExpressionNodeType>, context: C): any
}
