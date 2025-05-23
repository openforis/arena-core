import { ExpressionContext } from './context'
import { ExpressionFunction } from './function'
import { ExpressionNode, ExpressionNodeType } from './node'

export interface ExpressionEvaluator<C extends ExpressionContext> {
  functions: { [functionName: string]: ExpressionFunction<C> }
  evaluate(expression: string, context?: C): Promise<any>
  evaluateNode(expression: ExpressionNode<ExpressionNodeType>, context: C): Promise<any>
}
