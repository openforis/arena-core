import { Dictionary } from '../../common'
import { SystemError } from '../../error'

const globalObjectsDictionary: Dictionary<any> = {
  Array,
  Boolean,
  Date,
  Math,
  Number,
  String,
}
const globalObjectsArray = Object.values(globalObjectsDictionary)

export const getGlobalObjectProperty = (name: string, object: any): any => {
  const globalObject = globalObjectsDictionary[name]
  if (globalObject) {
    return globalObject
  }
  if (object && globalObjectsArray.includes(object)) {
    const property = object[name]

    if (!property) {
      throw new SystemError('expression.undefinedFunction', { name })
    }
    return property
  }
  return null
}
