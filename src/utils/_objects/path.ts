/**
 * Extracts the value in the specified path from the specified object.
 *
 * @param {array|string} path - Array of path parts or string with parts concatenated with dots.
 * @returns {any} Value at the specified path.
 */
export const path =
  (path: Array<string> | string) =>
  (obj: any): any => {
    if (!obj) return null

    const parts = Array.isArray(path) ? path : path.split('.')
    let current = obj
    let i = 0

    for (; i < parts.length; i++) {
      const part = parts[i]
      // stop when a value along the path is missing (undefined) or null
      if (current?.[part] === undefined) {
        return undefined
      }
      current = current[part]
    }
    return current
  }
