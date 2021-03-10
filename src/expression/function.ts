export interface ExpressionFunction {
  name: string
  minArity: number
  maxArity?: number
  executor: (...args: any[]) => any
  evaluateToNode?: boolean
}
