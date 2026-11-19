import { ArenaExpressionContext } from './context'
import { ArenaExpressionFunction } from './function'
import { ArenaExpressionNode, ExpressionNodeType } from './node'

export interface ArenaExpressionEvaluator<C extends ArenaExpressionContext> {
  functions: { [functionName: string]: ArenaExpressionFunction<C> }
  evaluate(expression: string, context?: C): Promise<any>
  evaluateNode(expression: ArenaExpressionNode<ExpressionNodeType>, context: C): Promise<any>
}
