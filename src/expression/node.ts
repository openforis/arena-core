import { ArenaExpressionEvaluator } from './evaluator'
import { ArenaExpressionContext } from './context'

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

export interface ArenaExpressionNode<T extends ExpressionNodeType> {
  type: T
}

export interface ArenaArrayExpression extends ArenaExpressionNode<ExpressionNodeType.Array> {
  elements: Array<ArenaAnyExpressionNode>
}
export interface ArenaBinaryExpression extends ArenaExpressionNode<ExpressionNodeType.Binary> {
  left: ArenaAnyExpressionNode
  right: ArenaAnyExpressionNode
  operator: string
}
export interface ArenaCallExpression extends ArenaExpressionNode<ExpressionNodeType.Call> {
  arguments: Array<ArenaAnyExpressionNode>
  callee: ArenaAnyExpressionNode
}
export type ArenaCompoundExpression = ArenaExpressionNode<ExpressionNodeType.Compound>
export interface ArenaConditionalExpression extends ArenaExpressionNode<ExpressionNodeType.Conditional> {
  test: ArenaAnyExpressionNode
  consequent: ArenaAnyExpressionNode
  alternate: ArenaAnyExpressionNode
}
export interface ArenaIdentifierExpression extends ArenaExpressionNode<ExpressionNodeType.Identifier> {
  name: string
}
export interface ArenaLiteralExpression extends ArenaExpressionNode<ExpressionNodeType.Literal> {
  raw: string
  value: any
}
export interface ArenaMemberExpression extends ArenaExpressionNode<ExpressionNodeType.Member> {
  computed: boolean
  object: ArenaAnyExpressionNode
  property: ArenaAnyExpressionNode
  optional?: boolean
}
export interface ArenaSequenceExpression extends ArenaExpressionNode<ExpressionNodeType.Sequence> {
  expression: ArenaAnyExpressionNode
}
export type ArenaThisExpression = ArenaExpressionNode<ExpressionNodeType.This>
export interface ArenaUnaryExpression extends ArenaExpressionNode<ExpressionNodeType.Unary> {
  argument: ArenaAnyExpressionNode
  operator: string
  prefix: boolean
}

/**
 * Union of all the expression node types: narrow it by `type` to get the specific node.
 */
export type ArenaAnyExpressionNode =
  | ArenaArrayExpression
  | ArenaBinaryExpression
  | ArenaCallExpression
  | ArenaCompoundExpression
  | ArenaConditionalExpression
  | ArenaIdentifierExpression
  | ArenaLiteralExpression
  | ArenaMemberExpression
  | ArenaSequenceExpression
  | ArenaThisExpression
  | ArenaUnaryExpression

export interface ArenaExpressionNodeEvaluatorConstructor<
  C extends ArenaExpressionContext,
  N extends ArenaExpressionNode<ExpressionNodeType>,
> {
  new (evaluator: ArenaExpressionEvaluator<C>, context: C): ExpressionNodeEvaluator<C, N>
}

export abstract class ExpressionNodeEvaluator<
  C extends ArenaExpressionContext,
  N extends ArenaExpressionNode<ExpressionNodeType>,
> {
  readonly evaluator: ArenaExpressionEvaluator<C>
  readonly context: C

  constructor(evaluator: ArenaExpressionEvaluator<C>, context: C) {
    this.evaluator = evaluator
    this.context = context
  }

  abstract evaluate(expressionNode: N): Promise<any>
}
