import { SystemError } from '../../../error'
import { ExpressionContext } from '../../context'
import { ExpressionNodeEvaluator, IdentifierExpression } from '../../node'
import { getGlobalObjectProperty } from '../global'

const getNativeProperty = (name: string, object: any) => {
  const prop = object?.[name]
  if (prop === undefined) {
    return undefined
  }
  return typeof prop === 'function' ? prop.bind(object) : prop
}

export class IdentifierEvaluator<C extends ExpressionContext> extends ExpressionNodeEvaluator<C, IdentifierExpression> {
  /**
   * Looks for the identifier among global or native properties, without throwing when it is not found
   * (creating errors captures stack traces, which is expensive when it happens for every evaluated identifier).
   *
   * @param expressionNode - The identifier expression node.
   * @returns The property value wrapped in an object, or null if the identifier has not been found.
   */
  protected findGlobalOrNativeProperty(expressionNode: IdentifierExpression): { value: any } | null {
    const { name } = expressionNode
    const { object: contextObject } = this.context

    const globalProp = getGlobalObjectProperty(name, contextObject)
    if (globalProp !== null) {
      return { value: globalProp }
    }
    const nativeProperty = getNativeProperty(name, contextObject)
    if (nativeProperty !== undefined) {
      return { value: nativeProperty }
    }
    return null
  }

  async evaluate(expressionNode: IdentifierExpression): Promise<any> {
    const property = this.findGlobalOrNativeProperty(expressionNode)
    if (property) {
      return property.value
    }
    throw new SystemError('expression.identifierNotFound', { name: expressionNode.name })
  }
}
