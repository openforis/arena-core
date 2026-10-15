import { AnyExpressionNode } from '../../node'
import { ExpressionParser } from '../../parser'
import { jsep } from './jsep'

export class JavascriptExpressionParser implements ExpressionParser {
  parse(expression: string): AnyExpressionNode {
    return jsep(expression) as AnyExpressionNode
  }
}
