import { ArenaAnyExpressionNode } from '../../node'
import { ExpressionParser } from '../../parser'
import { jsep } from './jsep'

export class JavascriptExpressionParser implements ExpressionParser {
  parse(expression: string): ArenaAnyExpressionNode {
    return jsep(expression) as ArenaAnyExpressionNode
  }
}
