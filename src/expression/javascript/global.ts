import { Dictionary } from '../../common'
import { SystemError, SystemErrorKeys } from '../../error'

const globalObjectsDictionary: Dictionary<any> = {
  Array,
  Boolean,
  Date,
  Math,
  Number,
  String,
}
const globalObjectsArray = Object.values(globalObjectsDictionary)

// properties leading to Object, Function or the prototypes would let an expression run arbitrary code
export const isForbiddenPropertyName = (name: string): boolean =>
  name === 'constructor' || name === 'prototype' || name.startsWith('__')

export const getGlobalObjectProperty = (name: string, object: any): any => {
  const globalObject = globalObjectsDictionary[name]
  if (globalObject) {
    return globalObject
  }
  if (object && globalObjectsArray.includes(object)) {
    const property = isForbiddenPropertyName(name) ? undefined : object[name]

    if (!property) {
      throw new SystemError(SystemErrorKeys.expression.undefinedFunction, { name })
    }
    return property
  }
  return null
}
