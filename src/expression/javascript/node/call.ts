import { SystemError, SystemErrorKeys } from '../../../error'
import { ExpressionContext } from '../../context'
import { ExpressionFunction } from '../../function'
import {
  CallExpression,
  ExpressionNodeEvaluator,
  ExpressionNodeType,
  IdentifierExpression,
  LiteralExpression,
  MemberExpression,
} from '../../node'
import { getGlobalObjectProperty } from '../global'
import { REG_EXP_INPUT_MAX_LENGTH } from '../regExpSafety'

// e.g. /.../.test(text) or text.match(/.../): the time taken by a regular expression grows with the input length
const checkRegExpInputLength = (fnObject: any, args: any[]): void => {
  const values = [fnObject, ...args]
  if (!values.some((value) => value instanceof RegExp)) return
  const inputTooLong = values.find((value) => typeof value === 'string' && value.length > REG_EXP_INPUT_MAX_LENGTH)
  if (inputTooLong !== undefined) {
    throw new SystemError(SystemErrorKeys.expression.regularExpressionInputTooLong, {
      maxLength: REG_EXP_INPUT_MAX_LENGTH,
      length: inputTooLong.length,
    })
  }
}

export class CallEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, CallExpression> {
  async evaluate(expressionNode: CallExpression): Promise<any> {
    const { callee } = expressionNode

    if (callee.type === ExpressionNodeType.Member) {
      return this.evaluateMember(expressionNode, callee)
    } else if (callee.type === ExpressionNodeType.Identifier) {
      return this.evaluateIdentifier(expressionNode, callee)
    }

    // No complex expressions may be put in place of a function body.
    // Only a plain identifier is allowed.
    throw new SystemError(SystemErrorKeys.expression.invalidCalleeType, { type: callee.type })
  }

  private async evaluateMember(expressionNode: CallExpression, callee: MemberExpression): Promise<any> {
    const { arguments: exprArgs } = expressionNode

    // evaluate the callee object only once: evaluating it again to find the function would take exponential time
    // with chained calls (e.g. text.trim().toUpperCase().toLowerCase())
    const fnObject = await this.evaluator.evaluateNode(callee.object, this.context)
    if (fnObject === null || fnObject === undefined) return null

    // find the function (e.g. Math.round or text.toUpperCase) among the properties of the already evaluated object
    const fnObjectLiteral: LiteralExpression = { type: ExpressionNodeType.Literal, value: fnObject, raw: '' }
    const calleeWithObjectEvaluated: MemberExpression = { ...callee, object: fnObjectLiteral }
    const fn = await this.evaluator.evaluateNode(calleeWithObjectEvaluated, this.context)
    if (fn) {
      const argsEvaluated = await Promise.all(exprArgs.map((arg) => this.evaluator.evaluateNode(arg, this.context)))
      const args = argsEvaluated.flat()
      checkRegExpInputLength(fnObject, args)
      return fn.call(fnObject, ...args)
    }
    return null
  }

  private async evaluateIdentifier(expressionNode: CallExpression, callee: IdentifierExpression): Promise<any> {
    // Arguments is a reserved word in strict mode
    const { arguments: exprArgs } = expressionNode
    const { object: contextObject } = this.context

    const { name: fnName } = callee

    const functionInfo = this.evaluator.functions[fnName]
    if (functionInfo) {
      // The function is among the custom functions.
      return this.evaluateCustomIdentifier(expressionNode, fnName)
    }
    // identifier is a global object
    const globalFn = getGlobalObjectProperty(fnName, contextObject)
    if (globalFn !== null) {
      // global functions like String, Number, must be invoked passing node value as argument, not the node itself
      const contextArg = { ...this.context, evaluateToNode: false }
      const args = await Promise.all(exprArgs.map((arg) => this.evaluator.evaluateNode(arg, contextArg)))
      return globalFn(...args)
    }

    throw new SystemError(SystemErrorKeys.expression.undefinedFunction, { name: fnName })
  }

  private async evaluateCustomIdentifier(expressionNode: CallExpression, fnName: string): Promise<any> {
    // Arguments is a reserved word in strict mode
    const { arguments: exprArgs } = expressionNode
    const numArgs = exprArgs.length

    const expressionFunction: ExpressionFunction<C> = this.evaluator.functions[fnName]

    const { minArity, maxArity, evaluateArgsToNodes, executor } = expressionFunction

    if (numArgs < minArity)
      throw new SystemError(SystemErrorKeys.expression.functionHasTooFewArguments, { fnName, minArity, numArgs })
    if (maxArity !== undefined && maxArity >= 0 && numArgs > maxArity)
      throw new SystemError(SystemErrorKeys.expression.functionHasTooManyArguments, { fnName, maxArity, numArgs })

    // evaluate arguments
    const argsContext = { ...this.context, evaluateToNode: evaluateArgsToNodes }
    const args = await Promise.all(exprArgs.map((arg) => this.evaluator.evaluateNode(arg, argsContext)))

    // Currently there are no side effects from function evaluation so it's
    // safe to call the function even when we're just parsing the expression
    // to find all identifiers being used.
    return executor(this.context)(...args)
  }
}
