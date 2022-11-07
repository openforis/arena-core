import { ExpressionContext } from '../context'
import { ExpressionEvaluator } from '../evaluator'
import { ExpressionFunctions } from '../function'
import { ExpressionNode, ExpressionNodeEvaluatorConstructor, ExpressionNodeType } from '../node'
import { SystemError } from '../../error'

import { functionsDefault } from './functionsDefault'
import { ArrayEvaluator } from './node/array'
import { BinaryEvaluator } from './node/binary'
import { CallEvaluator } from './node/call'
import { CompoundEvaluator } from './node/compound'
import { ConditionalEvaluator } from './node/conditional'
import { IdentifierEvaluator } from './node/identifier'
import { LiteralEvaluator } from './node/literal'
import { MemberEvaluator } from './node/member'
import { SequenceEvaluator } from './node/sequence'
import { ThisEvaluator } from './node/this'
import { UnaryEvaluator } from './node/unary'
import { JavascriptExpressionParser } from './parser/parser'

type Evaluators<C extends ExpressionContext> = {
  [nodeType in ExpressionNodeType]?: ExpressionNodeEvaluatorConstructor<C, ExpressionNode<ExpressionNodeType>>
}

const defaultEvaluators = {
  [ExpressionNodeType.Array]: ArrayEvaluator,
  [ExpressionNodeType.Binary]: BinaryEvaluator,
  [ExpressionNodeType.Call]: CallEvaluator,
  [ExpressionNodeType.Compound]: CompoundEvaluator,
  [ExpressionNodeType.Conditional]: ConditionalEvaluator,
  [ExpressionNodeType.Identifier]: IdentifierEvaluator,
  [ExpressionNodeType.Literal]: LiteralEvaluator,
  [ExpressionNodeType.Member]: MemberEvaluator,
  [ExpressionNodeType.Sequence]: SequenceEvaluator,
  [ExpressionNodeType.This]: ThisEvaluator,
  [ExpressionNodeType.Unary]: UnaryEvaluator,
}

export class JavascriptExpressionEvaluator<C extends ExpressionContext> implements ExpressionEvaluator<C> {
  functions: ExpressionFunctions<C>
  evaluators: Evaluators<C>

  constructor(functions: ExpressionFunctions<C> = {}, evaluators: Evaluators<C> = {}) {
    this.evaluators = { ...defaultEvaluators, ...evaluators }
    this.functions = { ...functionsDefault, ...functions }
  }

  evaluate(expression: string, context?: C): any {
    const parser = new JavascriptExpressionParser()
    return this.evaluateNode(parser.parse(expression), context || ({} as C))
  }

  evaluateNode(expressionNode: ExpressionNode<ExpressionNodeType>, context: C): any {
    const { type } = expressionNode

    const NodeEvaluator = this.evaluators[type]
    if (!NodeEvaluator) {
      throw new SystemError('expression.unsupportedFunctionType', { type })
    }
    return new NodeEvaluator(this, context).evaluate(expressionNode)
  }
}
