import { ExpressionContext, ExpressionNodeContext } from '../context'
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

type Evaluators<C extends ExpressionContext> = {
  [nodeType in ExpressionNodeType]?: ExpressionNodeEvaluatorConstructor<C, ExpressionNode<ExpressionNodeType>>
}

const defaultEvaluators = {
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

export class JavascriptExpressionEvaluator<C extends ExpressionContext> implements ExpressionEvaluator<C> {
  context: C
  functions: { [functionName: string]: ExpressionFunction }
  evaluators: Evaluators<C>

  constructor(functions: Array<ExpressionFunction> = [], evaluators: Evaluators<C> = {}) {
    this.evaluators = { ...defaultEvaluators, ...evaluators }
    this.functions = [...functionsDefault, ...functions].reduce<{ [functionName: string]: ExpressionFunction }>(
      (functionsAcc, expressionFunction) => ({ ...functionsAcc, [expressionFunction.name]: expressionFunction }),
      {}
    )
    this.context = {} as C
  }

  protected getEvaluateContext(): ExpressionNodeContext {
    return {}
  }

  evaluate(expression: string): any {
    return this.evaluateNode(jsep(expression), this.getEvaluateContext())
  }

  evaluateNode(expressionNode: ExpressionNode<ExpressionNodeType>, context: ExpressionNodeContext): any {
    const { type } = expressionNode

    const NodeEvaluator = this.evaluators[type]
    if (!NodeEvaluator) {
      throw new Error(`Unsupported function type: ${type}`)
    }
    return new NodeEvaluator(this, context).evaluate(expressionNode)
  }
}
