export const _camelCase = (str: string): string => str.replace(/[_.-](\w|$)/g, (_, x) => x.toUpperCase())

export const _walk = (options: { object: any; skip?: string[] }): any => {
  const { object, skip = [] } = options
  if (!object || !(object instanceof Object) || object instanceof Date || object instanceof RegExp) {
    return object
  }
  if (Array.isArray(object)) {
    return object.map((item) => _walk({ object: item }))
  }
  return Object.entries(object).reduce((objAcc, [key, value]) => {
    const skipped = skip.includes(key)
    const keyTransformed = skipped ? key : _camelCase(key)
    const valueTranformed: any = skipped ? value : _walk({ object: value })
    return { ...objAcc, [keyTransformed]: valueTranformed }
  }, {})
}

/**
 * Recursively transform the keys of the specified object to camel-case.
 *
 * @param {object} [params={}] - The camelize parameters.
 * @param {Array} [params.skip=[]] - An optional list of keys to skip.
 *
 * @returns {any} - The object with keys in camel case or the value in camel case.
 */

export const camelize = (options: { object: any; skip: string[] }): any => {
  const { object, skip } = options
  if (object instanceof String) {
    return _camelCase(String(object))
  }
  return _walk({ object, skip })
}
