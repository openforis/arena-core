export const _camelCase = (str: string): string => str.replace(/[_.-](\w|$)/g, (_, x) => x.toUpperCase())

export const _walk = (options: { object: any; skip?: string[]; limitToLevel?: number; sideEffect?: boolean }): any => {
  const { object, skip = [], limitToLevel = NaN, sideEffect } = options
  if (!object || !(object instanceof Object) || object instanceof Date || object instanceof RegExp) {
    return object
  }
  if (Array.isArray(object)) {
    return object.reduce(
      (acc, item, index) => {
        acc[index] = _walk({ object: item, limitToLevel, sideEffect })
        return acc
      },
      sideEffect ? object : []
    )
  }
  const nextLimitToLevel = limitToLevel ? limitToLevel - 1 : undefined

  return Object.entries(object).reduce(
    (objAcc: { [key: string]: any }, [key, value]) => {
      const skipped = skip.includes(key)
      const keyTransformed: string = skipped ? key : _camelCase(key)
      const valueTranformed =
        skipped || nextLimitToLevel === 0 ? value : _walk({ object: value, limitToLevel: nextLimitToLevel, sideEffect })

      objAcc[keyTransformed] = valueTranformed

      if (sideEffect && !skipped && keyTransformed !== key) {
        delete objAcc[key]
      }
      return objAcc
    },
    sideEffect ? object : {}
  )
}

/**
 * Recursively transform the keys of the specified object to camel-case.
 *
 * @param {!object} [object] - Object to be camelized
 * @param {!object} [options] - The camelize options.
 * @param {Array} [options.skip=array[]] - An optional list of keys to skip.
 *
 * @returns {any} - The object with keys in camel case or the value in camel case.
 */

export const camelize = (
  object: any,
  options: { skip?: string[]; limitToLevel?: number; sideEffect?: boolean } = {}
): any => {
  if (typeof object === 'string' || object instanceof String) {
    return _camelCase(object as string)
  }

  const { skip, limitToLevel, sideEffect } = options
  return _walk({ object, skip, limitToLevel, sideEffect })
}
