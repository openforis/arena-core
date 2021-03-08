import { ExpressionContext } from './expressionContext'
import { IExpressionEvaluator } from './iExpressionEvaluator'
import { JSExpr } from './jsExpr'

export interface ExpressionNodeEvaluator {
  expressionEvaluator: IExpressionEvaluator

  evaluate(expressionNode: JSExpr, context: ExpressionContext): any
}
