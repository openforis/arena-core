import { ExpressionNodeEvaluator, IdentifierExpression } from '../../node'
import { getGlobalObjectProperty } from '../global'

export class IdentifierEvaluator extends ExpressionNodeEvaluator<IdentifierExpression> {
  evaluate(expressionNode: IdentifierExpression): any {
    const { name } = expressionNode
    const globalProp = getGlobalObjectProperty(name, this.context.expressionNode)
    if (globalProp !== null) {
      return globalProp
    }
    throw new Error(`Identifier not found: ${name}`)
  }
}
