import { ArenaAnyExpressionNode, ExpressionNodeType } from '../../node'
import { JavascriptExpressionParser } from './parser'

const parser = new JavascriptExpressionParser()

/**
 * Visits the specified expression node and all its descendants (arguments, operands, compound bodies...).
 */
const visit = (value: unknown, visitor: (expressionNode: ArenaAnyExpressionNode) => void): void => {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, visitor)
    return
  }
  if (!value || typeof value !== 'object') return

  const expressionNode = value as ArenaAnyExpressionNode
  if (expressionNode.type) {
    visitor(expressionNode)
  }
  for (const child of Object.values(expressionNode)) {
    visit(child, visitor)
  }
}

const visitExpression = (expression: string, visitor: (expressionNode: ArenaAnyExpressionNode) => void): void => {
  try {
    visit(parser.parse(expression), visitor)
  } catch {
    // invalid expression (reported by the expression validator)
  }
}

/**
 * Finds the names of the functions called in the specified expression (e.g. "now" in "now() > date_attr").
 * Returns an empty set if the expression is empty or cannot be parsed.
 * @param expression - The expression to search in.
 * @returns The names of the called functions.
 */
export const findFunctionCallNames = (expression: string | undefined | null): Set<string> => {
  const names = new Set<string>()
  if (!expression) return names
  visitExpression(expression, (expressionNode) => {
    if (
      expressionNode.type === ExpressionNodeType.Call &&
      expressionNode.callee.type === ExpressionNodeType.Identifier
    ) {
      names.add(expressionNode.callee.name)
    }
  })
  return names
}

const usesThisCache = new Map<string, boolean>()

/**
 * Returns true if the specified expression uses the "this" keyword (results are cached by expression).
 * @param expression - The expression to search in.
 * @returns True if "this" is used in the expression.
 */
export const expressionUsesThis = (expression: string | undefined | null): boolean => {
  if (!expression) return false
  let result = usesThisCache.get(expression)
  if (result === undefined) {
    result = false
    visitExpression(expression, (expressionNode) => {
      if (expressionNode.type === ExpressionNodeType.This) result = true
    })
    usesThisCache.set(expression, result)
  }
  return result
}
