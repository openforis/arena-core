import { ExpressionNode, ExpressionNodeType } from '../../node'
import { ExpressionParser } from '../../parser'
import { jsep } from './jsep'

export class JavascriptExpressionParser implements ExpressionParser {
  parse(expression: string): ExpressionNode<ExpressionNodeType> {
    return jsep(expression) as ExpressionNode<ExpressionNodeType>
  }
}
