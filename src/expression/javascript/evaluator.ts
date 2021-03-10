import { ExpressionContext } from '../context'
import { ExpressionEvaluator } from '../evaluator'
import { ExpressionFunction } from '../function'
import { ExpressionNode, ExpressionNodeEvaluatorConstructor, ExpressionNodeType } from '../node'

import { functionsDefault } from './functionsDefault'
import { BinaryEvaluator } from './node/binary'
import { CallEvaluator } from './node/call'
import { CompoundEvaluator } from './node/compound'
import { GroupEvaluator } from './node/group'
import { IdentifierEvaluator } from './node/identifier'
import { LiteralEvaluator } from './node/literal'
import { MemberEvaluator } from './node/member'
import { ThisEvaluator } from './node/this'
import { UnaryEvaluator } from './node/unary'
// @ts-ignore
import * as jsep from './parser/jsep'

export class JavascriptExpressionEvaluator implements ExpressionEvaluator {
  functions: { [functionName: string]: ExpressionFunction }
  evaluators: {
    [nodeType in ExpressionNodeType]: ExpressionNodeEvaluatorConstructor<ExpressionNode<ExpressionNodeType>>
  }

  constructor(functions: Array<ExpressionFunction> = []) {
    this.evaluators = {
      [ExpressionNodeType.Binary]: BinaryEvaluator,
      [ExpressionNodeType.Call]: CallEvaluator,
      [ExpressionNodeType.Compound]: CompoundEvaluator,
      [ExpressionNodeType.Group]: GroupEvaluator,
      [ExpressionNodeType.Identifier]: IdentifierEvaluator,
      [ExpressionNodeType.Literal]: LiteralEvaluator,
      [ExpressionNodeType.Logical]: BinaryEvaluator,
      [ExpressionNodeType.Member]: MemberEvaluator,
      [ExpressionNodeType.This]: ThisEvaluator,
      [ExpressionNodeType.Unary]: UnaryEvaluator,
    }
    this.functions = [...functionsDefault, ...functions].reduce<{ [functionName: string]: ExpressionFunction }>(
      (functionsAcc, expressionFunction) => ({ ...functionsAcc, [expressionFunction.name]: expressionFunction }),
      {}
    )
  }

  evaluate(expression: string): any {
    return this.evaluateNode(jsep(expression), {})
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
