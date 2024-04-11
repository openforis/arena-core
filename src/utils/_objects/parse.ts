import { isEmpty } from './isEmpty'
import { isNil } from './isNil'

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
    if (value.__type === 'Map') return new Map(parse(value.__values) as Array<any>)
    if (value.__type === 'Set') return new Set(parse(value.__values) as Array<any>)
    return value
  })
}
