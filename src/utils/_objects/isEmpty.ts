import { isNil } from './isNil'

/**
 * Determines if the specified value is null, undefined, empty string, NaN, invalid date, empty object or empty array.
 *
 * @param {any} value - Value to verify.
 * @returns {boolean} True if the specified value is empty, false otherwise.
 */
export const isEmpty = (value: any): boolean => {
  if (isNil(value) || Number.isNaN(value)) {
    return true
  }
  if (value.length !== undefined) {
    return value.length === 0
  }
  if (value instanceof Date) {
    return isNaN(value.getTime())
  }
  if (value instanceof Function) {
    return false
  }
  if (value instanceof Object) {
    // Do not use Object.keys(obj).length. It is O(N) complexity because it creates an array containing all the property names only to get the length of that array.
    // Iterating over the object accomplishes the same goal but is O(1).
    for (const prop in value) {
      if (Object.hasOwn(value, prop)) {
        return false
      }
    }
    return true
  }
  return false
}
