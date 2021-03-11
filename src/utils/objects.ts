/**
 * Determines if the specified value is null, empty string, NaN, empty object or empty array.
 *
 * @param {any} value - Value to
 * @returns {boolean} True if the specified value is empty, false otherwise.
 */
const isEmpty = (value: any): boolean =>
  value === null ||
  value === '' ||
  Number.isNaN(value) ||
  (value instanceof Object && Object.entries(value).length === 0) ||
  (Array.isArray(value) && value.length === 0)

/**
 * Extracts the value in the specified path from the specified object.
 *
 * @param {array|string} path - Array of path parts or string with parts concatenated with dots.
 * @returns {any} Value at the specified path.
 */
const path = (path: Array<string> | string) => (obj: any): any => {
  if (!obj) return null

  const parts = Array.isArray(path) ? path : path.split('.')
  let current = obj
  let i = 0

  for (; i < parts.length; i++) {
    const part = parts[i]
    if (current[part] === undefined) {
      return undefined
    } else {
      current = current[part]
    }
  }
  return current
}

export const Objects = {
  isEmpty,
  path,
}
