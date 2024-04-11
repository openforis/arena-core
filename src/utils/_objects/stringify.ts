import { isNil } from './isNil'

export enum StringifyKeys {
  type = '_type_',
  values = '_values_',
}

/**
 * Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
 * It handles objects, arrays, Map, Set, String, Number.
 *
 * @param {*} object - The value, object, to stringify.
 * @param _replacer - Custom replacer (not used yet)
 * @param space
 * @returns {*} - The stringified object.
 */
export const stringify = (
  object: any,
  _replacer?: (key: string, value: any) => any,
  space = undefined
): string | null => {
  if (isNil(object)) return null

  const replacer = (key: string, value: any): any => {
    if (isNil(value)) return null

    if (isNil(key)) {
      return stringify(value)
    }
    if (value.constructor === Map)
      return {
        [StringifyKeys.type]: 'Map',
        [StringifyKeys.values]: stringify(Array.from(value.entries())),
      }
    if (value.constructor === Set)
      return {
        [StringifyKeys.type]: 'Set',
        [StringifyKeys.values]: stringify([...value]),
      }
    return value
  }
  return JSON.stringify(object, replacer as any, space)
}
