import { ExpressionContext } from '../context'
import { ExpressionEvaluator } from '../evaluator'
import { ExpressionFunction } from '../function'
import { ExpressionNode, ExpressionNodeEvaluatorConstructor, ExpressionNodeType } from '../node'
import jsep from './parser/jsep'
import { UnaryEvaluator } from './node/unary'

export class JavascriptExpressionEvaluator implements ExpressionEvaluator {
  functions: { [functionName: string]: ExpressionFunction }
  evaluators: {
    [nodeType in ExpressionNodeType]: ExpressionNodeEvaluatorConstructor<ExpressionNode<ExpressionNodeType>>
  }

  constructor() {
    this.evaluators = {
      [ExpressionNodeType.Unary]: UnaryEvaluator,
    }
  }

  parse(expression: string): ExpressionNode<ExpressionNodeType> {
    return jsep(expression)
  }

  evaluate(expression: string, context: ExpressionContext): any {
    const expr = this.parse(expression)
    return this.evaluateNode(expr, context)
  }

  evaluateNode(expressionNode: ExpressionNode<ExpressionNodeType>, context: ExpressionContext): any {
    const { type } = expressionNode
    const NodeEvaluator: ExpressionNodeEvaluatorConstructor<ExpressionNode<ExpressionNodeType>> = this.evaluators[type]
    if (!NodeEvaluator) {
      throw new Error(`Unsupported function type: ${type}`)
    }
    return new NodeEvaluator(this, context).evaluate(expressionNode)
  }
}
