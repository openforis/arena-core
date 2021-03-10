import { ExpressionEvaluator } from './evaluator'
import { ExpressionContext } from './context'

export const enum ExpressionNodeType {
  Binary = 'BinaryExpression',
  Call = 'CallExpression',
  Compound = 'Compound',
  Group = 'GroupExpression',
  Identifier = 'Identifier',
  Literal = 'Literal',
  Logical = 'LogicalExpression',
  Member = 'MemberExpression',
  This = 'ThisExpression',
  Unary = 'UnaryExpression',
}

export interface ExpressionNode<T extends ExpressionNodeType> {
  name: string
  type: T
}

export interface BinaryExpression extends ExpressionNode<ExpressionNodeType.Binary> {
  left: ExpressionNode<ExpressionNodeType>
  right: ExpressionNode<ExpressionNodeType>
  operator: string
}
export interface CallExpression extends ExpressionNode<ExpressionNodeType.Call> {
  arguments: Array<ExpressionNode<ExpressionNodeType>>
  callee: ExpressionNode<ExpressionNodeType>
}
export type CompoundExpression = ExpressionNode<ExpressionNodeType.Compound>
export interface GroupExpression extends ExpressionNode<ExpressionNodeType.Group> {
  argument: ExpressionNode<ExpressionNodeType>
}
export type IdentifierExpression = ExpressionNode<ExpressionNodeType.Identifier>
export interface LiteralExpression extends ExpressionNode<ExpressionNodeType.Literal> {
  value: any
}
export type LogicalExpression = ExpressionNode<ExpressionNodeType.Logical>
export interface MemberExpression extends ExpressionNode<ExpressionNodeType.Member> {
  object: ExpressionNode<ExpressionNodeType>
  property: ExpressionNode<ExpressionNodeType>
  computed: boolean
}
export type ThisExpression = ExpressionNode<ExpressionNodeType.This>
export interface UnaryExpression extends ExpressionNode<ExpressionNodeType.Unary> {
  argument: ExpressionNode<ExpressionNodeType>
  operator: string
}

export interface ExpressionNodeEvaluatorConstructor<N extends ExpressionNode<ExpressionNodeType>> {
  new (evaluator: ExpressionEvaluator, context: ExpressionContext): ExpressionNodeEvaluator<N>
}

export abstract class ExpressionNodeEvaluator<N extends ExpressionNode<ExpressionNodeType>> {
  readonly evaluator: ExpressionEvaluator
  readonly context: ExpressionContext

  constructor(evaluator: ExpressionEvaluator, context: ExpressionContext) {
    this.evaluator = evaluator
    this.context = context
  }

  abstract evaluate(expressionNode: N): any
}
