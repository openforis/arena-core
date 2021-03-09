export interface ExpressionFunction {
  name: string
  minArity: number
  maxArity?: number
  executor: <P = unknown, R = unknown>(args?: P) => R
}
