import { SystemError, SystemErrorKeys } from '../../../error'
import { ArenaExpressionContext } from '../../context'
import { ExpressionNodeEvaluator, ArenaIdentifierExpression } from '../../node'
import { getGlobalObjectProperty, isForbiddenPropertyName, isForbiddenValue } from '../global'

const getNativeProperty = (name: string, object: any) => {
  if (isForbiddenPropertyName(name) || isForbiddenValue(object)) {
    return undefined
  }
  const prop = object?.[name]
  if (prop === undefined || isForbiddenValue(prop)) {
    return undefined
  }
  return typeof prop === 'function' ? prop.bind(object) : prop
}

export class IdentifierEvaluator<C extends ArenaExpressionContext> extends ExpressionNodeEvaluator<
  C,
  ArenaIdentifierExpression
> {
  /**
   * Looks for the identifier among global or native properties, without throwing when it is not found
   * (creating errors captures stack traces, which is expensive when it happens for every evaluated identifier).
   *
   * @param expressionNode - The identifier expression node.
   * @returns The property value wrapped in an object, or null if the identifier has not been found.
   */
  protected findGlobalOrNativeProperty(expressionNode: ArenaIdentifierExpression): { value: any } | null {
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

  evaluate(expressionNode: ArenaIdentifierExpression): Promise<any> {
    const property = this.findGlobalOrNativeProperty(expressionNode)
    if (property) {
      return Promise.resolve(property.value)
    }
    return Promise.reject(new SystemError(SystemErrorKeys.expression.identifierNotFound, { name: expressionNode.name }))
  }
}
