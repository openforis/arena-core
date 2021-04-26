import { ExpressionContext } from './context'

export interface ExpressionFunction<C extends ExpressionContext> {
  name: string
  minArity: number
  maxArity?: number
  executor: (conxtext: C) => (...args: any[]) => any
  evaluateToNode?: boolean
}
