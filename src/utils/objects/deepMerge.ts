/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
const isObject = (item: any): boolean => {
  return item && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function deepMerge(
  target: Record<string, any>,
  ...sources: Array<Record<string, any>>
): Record<string, unknown> {
  const _target = { ...target }
  if (!sources.length) return _target

  const source = sources.shift()

  if (isObject(_target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!_target[key]) Object.assign(_target, { [key]: {} })
        deepMerge(_target[key], source[key])
      } else {
        Object.assign(_target, { [key]: source[key] })
      }
    }
  }

  return deepMerge(_target, ...sources)
}
