import { isEmpty } from './isEmpty'
import { isNil } from './isNil'
import { StringifyKeys } from './stringify'

const collectionConstructorByValueType: { [key: string]: any } = {
  Map,
  Set,
}

/**
 * Converts a JavaScript Object Notation (JSON) string to an object.
 * It handles objects, arrays, Map, Set, String, Number.
 * It is the inverse of stringify.
 *
 * @param {string | null | undefined} text - The string to parse.
 * @returns {*} - The parsed object.
 */
export const parse = (text: string | null | undefined): object | Array<any> | null => {
  if (isNil(text)) return null
  if (isEmpty(text)) return {}

  return JSON.parse(text as string, (_key, value) => {
    if (isNil(value)) return null
    const valueType = value[StringifyKeys.type]
    if (valueType) {
      const collectionConstructor = collectionConstructorByValueType[valueType]
      if (collectionConstructor) {
        const values = parse(value[StringifyKeys.values]) as Array<any>
        return new collectionConstructor(values)
      }
    }
    return value
  })
}
