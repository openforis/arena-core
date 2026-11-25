import { ArenaAnyExpressionNode, ExpressionNodeType } from '../../node'
import { JavascriptExpressionParser } from './parser'

const parser = new JavascriptExpressionParser()

const visit = (value: unknown, names: Set<string>): void => {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, names)
    return
  }
  if (!value || typeof value !== 'object') return

  const expressionNode = value as ArenaAnyExpressionNode
  if (expressionNode.type === ExpressionNodeType.Call && expressionNode.callee.type === ExpressionNodeType.Identifier) {
    names.add(expressionNode.callee.name)
  }
  // visit every child expression node (arguments, operands, compound bodies...)
  for (const child of Object.values(expressionNode)) {
    visit(child, names)
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
  try {
    visit(parser.parse(expression), names)
  } catch {
    // invalid expression (reported by the expression validator)
  }
  return names
}
