import { ExpressionContext } from '../../context'
import { ExpressionFunction } from '../../function'
import { CallExpression, ExpressionNodeEvaluator, ExpressionNodeType } from '../../node'
import { getGlobalObjectProperty } from '../global'

export class CallEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, CallExpression> {
  evaluate(expressionNode: CallExpression): any {
    const { callee } = expressionNode

    if (callee.type === ExpressionNodeType.Member) {
      return this.evaluateMember(expressionNode)
    } else if (callee.type === ExpressionNodeType.Identifier) {
      return this.evaluateIdentifier(expressionNode)
    }

    // No complex expressions may be put in place of a function body.
    // Only a plain identifier is allowed.
    throw new Error(`invalidSyntax ${callee.type}`)
  }

  evaluateMember(expressionNode: CallExpression): any {
    const { callee, arguments: exprArgs } = expressionNode

    // global function (e.g. Math.round(...))
    const fn = this.evaluator.evaluateNode(callee, this.context)
    if (fn) {
      const args = exprArgs.map((arg) => this.evaluator.evaluateNode(arg, this.context))
      return fn(...args)
    }
    return null
  }

  evaluateIdentifier(expressionNode: CallExpression): any {
    // Arguments is a reserved word in strict mode
    const { callee, arguments: exprArgs } = expressionNode
    const { object: contextObject } = this.context

    const { name: fnName } = callee

    const functionInfo = this.evaluator.functions[fnName]
    if (functionInfo) {
      // The function is among the custom functions.
      return this.evaluateCustomIdentifier(expressionNode)
    }
    // identifier is a global object
    const globalFn = getGlobalObjectProperty(fnName, contextObject)
    if (globalFn !== null) {
      const args = exprArgs.map((arg) => this.evaluator.evaluateNode(arg, this.context))
      return globalFn(...args)
    }

    throw new Error(`undefinedFunction ${fnName}`)
  }

  evaluateCustomIdentifier(expressionNode: CallExpression): any {
    // Arguments is a reserved word in strict mode
    const { callee, arguments: exprArgs } = expressionNode

    const { name: fnName } = callee
    const numArgs = exprArgs.length

    const expressionFunction: ExpressionFunction = this.evaluator.functions[fnName]

    const { minArity, maxArity, evaluateToNode } = expressionFunction

    if (numArgs < minArity) throw new Error(`functionHasTooFewArguments`)
    if (maxArity && maxArity > 0 && numArgs > maxArity) throw new Error('functionHasTooManyArguments')

    const args = exprArgs.map((arg) => this.evaluator.evaluateNode(arg, { ...this.context, evaluateToNode }))

    // Currently there are no side effects from function evaluation so it's
    // safe to call the function even when we're just parsing the expression
    // to find all identifiers being used.
    return expressionFunction.executor(...args)
  }
}
