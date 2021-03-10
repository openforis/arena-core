import { ExpressionNode, ExpressionNodeType } from './node'

export interface ExpressionContext {
  expressionNode?: ExpressionNode<ExpressionNodeType>
  evaluateToNode?: boolean
}
