import { JSExpr } from './jsExpr'

export interface IExpressionEvaluator {
  evaluate(expression: JSExpr, context: any): any
}
