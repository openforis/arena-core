import { ExpressionEvaluator } from './evaluator'
import { ExpressionContext } from './context'

export const enum ExpressionNodeType {
  Binary = 'BinaryExpression',
  Call = 'CallExpression',
  Compound = 'Compound',
  Identifier = 'Identifier',
  Literal = 'Literal',
  Member = 'MemberExpression',
  Sequence = 'SequenceExpression',
  This = 'ThisExpression',
  Unary = 'UnaryExpression',
}

export interface ExpressionNode<T extends ExpressionNodeType> {
  name?: string
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
export type IdentifierExpression = ExpressionNode<ExpressionNodeType.Identifier>
export interface LiteralExpression extends ExpressionNode<ExpressionNodeType.Literal> {
  value: any
}
export interface MemberExpression extends ExpressionNode<ExpressionNodeType.Member> {
  object: ExpressionNode<ExpressionNodeType>
  property: ExpressionNode<ExpressionNodeType>
  computed: boolean
}
export interface SequenceExpression extends ExpressionNode<ExpressionNodeType.Sequence> {
  expression: ExpressionNode<ExpressionNodeType>
}
export type ThisExpression = ExpressionNode<ExpressionNodeType.This>
export interface UnaryExpression extends ExpressionNode<ExpressionNodeType.Unary> {
  argument: ExpressionNode<ExpressionNodeType>
  operator: string
}

export interface ExpressionNodeEvaluatorConstructor<
  C extends ExpressionContext,
  N extends ExpressionNode<ExpressionNodeType>
> {
  new (evaluator: ExpressionEvaluator<C>, context: C): ExpressionNodeEvaluator<C, N>
}

export abstract class ExpressionNodeEvaluator<
  C extends ExpressionContext,
  N extends ExpressionNode<ExpressionNodeType>
> {
  readonly evaluator: ExpressionEvaluator<C>
  readonly context: C

  constructor(evaluator: ExpressionEvaluator<C>, context: C) {
    this.evaluator = evaluator
    this.context = context
  }

  abstract evaluate(expressionNode: N): any
}
