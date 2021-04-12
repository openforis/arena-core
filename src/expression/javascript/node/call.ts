import { ExpressionContext } from '../../context'
import { ExpressionFunction } from '../../function'
import { CallExpression, ExpressionNodeEvaluator, ExpressionNodeType } from '../../node'
import { getGlobalObjectProperty } from '../global'

export class CallEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, CallExpression> {
  async evaluate(expressionNode: CallExpression): Promise<any> {
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

  private async evaluateExpressionArgs(expressionNode: CallExpression, evaluateToNode = false): Promise<any[]> {
    const { arguments: exprArgs } = expressionNode
    return Promise.all(exprArgs.map((arg) => this.evaluator.evaluateNode(arg, { ...this.context, evaluateToNode })))
  }

  private async evaluateMember(expressionNode: CallExpression): Promise<any> {
    const { callee } = expressionNode

    // global function (e.g. Math.round(...))
    const fn = await this.evaluator.evaluateNode(callee, this.context)
    if (fn) {
      const args = await this.evaluateExpressionArgs(expressionNode)
      return fn(...args)
    }
    return null
  }

  private async evaluateIdentifier(expressionNode: CallExpression): Promise<any> {
    // Arguments is a reserved word in strict mode
    const { callee } = expressionNode
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
      const args = await this.evaluateExpressionArgs(expressionNode)
      return globalFn(...args)
    }

    throw new Error(`undefinedFunction ${fnName}`)
  }

  async evaluateCustomIdentifier(expressionNode: CallExpression): Promise<any> {
    // Arguments is a reserved word in strict mode
    const { callee, arguments: exprArgs } = expressionNode

    const { name: fnName } = callee
    const numArgs = exprArgs.length

    const expressionFunction: ExpressionFunction<C> = this.evaluator.functions[fnName]

    const { minArity, maxArity, evaluateToNode, executor } = expressionFunction

    if (numArgs < minArity) throw new Error(`functionHasTooFewArguments`)
    if (maxArity && maxArity > 0 && numArgs > maxArity) throw new Error('functionHasTooManyArguments')

    const args = await this.evaluateExpressionArgs(expressionNode, evaluateToNode)

    // Currently there are no side effects from function evaluation so it's
    // safe to call the function even when we're just parsing the expression
    // to find all identifiers being used.
    return executor(this.context)(...args)
  }
}
