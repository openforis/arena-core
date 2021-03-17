import { ExpressionNode, ExpressionNodeType } from './node'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExpressionContext {}

export interface ExpressionNodeContext {
  expressionNode?: ExpressionNode<ExpressionNodeType>
  evaluateToNode?: boolean
}
