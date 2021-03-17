import { ExpressionContext } from '../../context'
import { ExpressionNodeEvaluator, IdentifierExpression } from '../../node'
import { getGlobalObjectProperty } from '../global'

const getNativeProperty = (name: string, object: any) => {
  const prop = object && object[name]
  if (prop === undefined) {
    return undefined
  }
  return prop instanceof Function ? prop.bind(object) : prop
}

export class IdentifierEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, IdentifierExpression> {
  evaluate(expressionNode: IdentifierExpression): any {
    const { name } = expressionNode

    const globalProp = getGlobalObjectProperty(name, this.context.expressionNode)
    if (globalProp !== null) {
      return globalProp
    }
    const nativeProperty = getNativeProperty(name, this.context.expressionNode)
    if (nativeProperty !== undefined) {
      return nativeProperty
    }
    throw new Error(`Identifier not found: ${name}`)
  }
}
