import { IdentifierExpression, MemberExpression } from '../..'
import { SystemError } from '../../../error'
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
    throw new SystemError('expression.invalidCalleeType', { type: callee.type })
  }

  evaluateMember(expressionNode: CallExpression): any {
    const { callee, arguments: exprArgs } = expressionNode

    // global function (e.g. Math.round(...))
    const fn = this.evaluator.evaluateNode(callee, this.context)
    if (fn) {
      const { object: calleeObj } = callee as MemberExpression
      const fnObject = this.evaluator.evaluateNode(calleeObj, this.context)
      const args = exprArgs.flatMap((arg) => this.evaluator.evaluateNode(arg, this.context))
      return fn.call(fnObject, ...args)
    }
    return null
  }

  evaluateIdentifier(expressionNode: CallExpression): any {
    // Arguments is a reserved word in strict mode
    const { callee, arguments: exprArgs } = expressionNode
    const { object: contextObject } = this.context

    const { name: fnName } = callee as IdentifierExpression

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

    throw new SystemError('expression.undefinedFunction', { name: fnName })
  }

  evaluateCustomIdentifier(expressionNode: CallExpression): any {
    // Arguments is a reserved word in strict mode
    const { callee, arguments: exprArgs } = expressionNode

    const { name: fnName } = callee as IdentifierExpression
    const numArgs = exprArgs.length

    const expressionFunction: ExpressionFunction<C> = this.evaluator.functions[fnName]

    const { minArity, maxArity, evaluateArgsToNodes, executor } = expressionFunction

    if (numArgs < minArity) throw new SystemError('expression.functionHasTooFewArguments', { name: fnName })
    if (maxArity && maxArity > 0 && numArgs > maxArity)
      throw new SystemError('expression.functionHasTooManyArguments', { name: fnName })

    const args = exprArgs.map((arg) =>
      this.evaluator.evaluateNode(arg, {
        ...this.context,
        evaluateToNode: evaluateArgsToNodes,
      })
    )

    // Currently there are no side effects from function evaluation so it's
    // safe to call the function even when we're just parsing the expression
    // to find all identifiers being used.
    return executor(this.context)(...args)
  }
}
