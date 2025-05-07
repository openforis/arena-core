import { SystemError } from '../../../error'
import { Objects } from '../../../utils'
import { ExpressionContext } from '../../context'
import { BinaryExpression, ExpressionNodeEvaluator } from '../../node'

const booleanOperators: { [operator: string]: (a: any, b: any) => boolean } = {
  // Short-circuiting operators (we coerce the output to bool)
  '||': (a, b) => Boolean(a || b),
  '&&': (a, b) => Boolean(a && b),
  // Normal boolean operators:
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
  '<': (a, b) => a < b,
  '>': (a, b) => a > b,
  '<=': (a, b) => a <= b,
  '>=': (a, b) => a >= b,
  // Only allow one kind of equalities.
  // some hidden dependencies on === and !==...
  // '===':  (a, b) => a === b,
  // '!==':  (a, b) => a !== b,
}

const arithmeticOperators: { [operator: string]: (a: number, b: number) => number } = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '%': (a, b) => a % b,
  '**': (a, b) => a ** b,
  // Don't allow bitwise operators:
  // '|':   (a, b) => a | b,
  // '^':   (a, b) => a ^ b,
  // '&':   (a, b) => a & b,
  // Don't allow shifts either:
  // '<<':  (a, b) => a << b,
  // '>>':  (a, b) => a >> b,
  // '>>>': (a, b) => a >>> b,
}

const stringOperators: { [operatos: string]: (a: string, b: string) => string } = {
  '+': (a, b) => a + b,
}

const binaryOperators = {
  ...booleanOperators,
  ...arithmeticOperators,
}

const isNumber = (value: any) => !Objects.isNil(value) && value.constructor === Number
const isString = (value: any) => !Objects.isNil(value) && value.constructor === String

export class BinaryEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, BinaryExpression> {
  async evaluate(expressionNode: BinaryExpression): Promise<any> {
    const { left, right, operator } = expressionNode

    const fn = binaryOperators[operator]
    if (!fn) {
      throw new SystemError('expression.booleanOperatorNotSupported', { operator })
    }

    const leftResult = await this.evaluator.evaluateNode(left, this.context)
    const rightResult = await this.evaluator.evaluateNode(right, this.context)

    // string operators
    if (operator in stringOperators) {
      if (isString(leftResult) || isString(rightResult)) {
        const strFn = stringOperators[operator]
        return strFn(leftResult as string, rightResult as string)
      }
      // operator can be in arithmeticOperators (+), do not return anything now
    }

    // Arithmetic operators will always return nulls for any non-numeric inputs
    if (operator in arithmeticOperators) {
      if (isNumber(leftResult) && isNumber(rightResult)) {
        return fn(leftResult as number, rightResult as number)
      }
      return null
    }

    const nullCount = [leftResult, rightResult].filter((result) => result === null || result === undefined).length

    // Boolean operators:
    // Like ternary logic, but logical OR has special handling.
    // The expression is boolean if either value is not null.
    // Otherwise the result is null.
    // All other operators return null if either operand is null
    const isValid = (operator === '||' && nullCount < 2) || nullCount === 0

    return isValid ? fn(leftResult, rightResult) : null
  }
}
