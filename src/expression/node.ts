import { ExpressionEvaluator } from './evaluator'
import { ExpressionContext } from './context'

export enum ExpressionNodeType {
  Array = 'ArrayExpression',
  Binary = 'BinaryExpression',
  Call = 'CallExpression',
  Compound = 'Compound',
  Conditional = 'ConditionalExpression',
  Identifier = 'Identifier',
  Literal = 'Literal',
  Member = 'MemberExpression',
  Sequence = 'SequenceExpression',
  This = 'ThisExpression',
  Unary = 'UnaryExpression',
}

export interface ExpressionNode<T extends ExpressionNodeType> {
  type: T
}

export interface ArrayExpression extends ExpressionNode<ExpressionNodeType.Array> {
  elements: Array<AnyExpressionNode>
}
export interface BinaryExpression extends ExpressionNode<ExpressionNodeType.Binary> {
  left: AnyExpressionNode
  right: AnyExpressionNode
  operator: string
}
export interface CallExpression extends ExpressionNode<ExpressionNodeType.Call> {
  arguments: Array<AnyExpressionNode>
  callee: AnyExpressionNode
}
export type CompoundExpression = ExpressionNode<ExpressionNodeType.Compound>
export interface ConditionalExpression extends ExpressionNode<ExpressionNodeType.Conditional> {
  test: AnyExpressionNode
  consequent: AnyExpressionNode
  alternate: AnyExpressionNode
}
export interface IdentifierExpression extends ExpressionNode<ExpressionNodeType.Identifier> {
  name: string
}
export interface LiteralExpression extends ExpressionNode<ExpressionNodeType.Literal> {
  raw: string
  value: any
}
export interface MemberExpression extends ExpressionNode<ExpressionNodeType.Member> {
  computed: boolean
  object: AnyExpressionNode
  property: AnyExpressionNode
  optional?: boolean
}
export interface SequenceExpression extends ExpressionNode<ExpressionNodeType.Sequence> {
  expression: AnyExpressionNode
}
export type ThisExpression = ExpressionNode<ExpressionNodeType.This>
export interface UnaryExpression extends ExpressionNode<ExpressionNodeType.Unary> {
  argument: AnyExpressionNode
  operator: string
  prefix: boolean
}

/**
 * Union of all the expression node types: narrow it by `type` to get the specific node.
 */
export type AnyExpressionNode =
  | ArrayExpression
  | BinaryExpression
  | CallExpression
  | CompoundExpression
  | ConditionalExpression
  | IdentifierExpression
  | LiteralExpression
  | MemberExpression
  | SequenceExpression
  | ThisExpression
  | UnaryExpression

export interface ExpressionNodeEvaluatorConstructor<
  C extends ExpressionContext,
  N extends ExpressionNode<ExpressionNodeType>,
> {
  new (evaluator: ExpressionEvaluator<C>, context: C): ExpressionNodeEvaluator<C, N>
}

export abstract class ExpressionNodeEvaluator<
  C extends ExpressionContext,
  N extends ExpressionNode<ExpressionNodeType>,
> {
  readonly evaluator: ExpressionEvaluator<C>
  readonly context: C

  constructor(evaluator: ExpressionEvaluator<C>, context: C) {
    this.evaluator = evaluator
    this.context = context
  }

  abstract evaluate(expressionNode: N): Promise<any>
}
