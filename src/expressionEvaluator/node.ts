import { ExpressionEvaluator } from './evaluator'
import { ExpressionContext } from './context'

export const enum ExpressionNodeType {
  BinaryExpression = 'BinaryExpression',
  CallExpression = 'CallExpression',
  Compound = 'Compound',
  GroupExpression = 'GroupExpression',
  Identifier = 'Identifier',
  Literal = 'Literal',
  LogicalExpression = 'LogicalExpression',
  MemberExpression = 'MemberExpression',
  ThisExpression = 'ThisExpression',
  UnaryExpression = 'UnaryExpression',
}

export interface ExpressionNode {
  type: ExpressionNodeType
}

export interface ExpressionNodeEvaluator {
  evaluator: ExpressionEvaluator
  evaluate(expressionNode: ExpressionNode, context: ExpressionContext): any
}
