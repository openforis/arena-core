import { ArenaExpressionNode, ExpressionNodeType } from './node'

export interface ExpressionParser {
  parse(expression: string): ArenaExpressionNode<ExpressionNodeType>
}
