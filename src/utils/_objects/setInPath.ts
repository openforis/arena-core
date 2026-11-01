import { isEmpty } from './isEmpty'

/**
 * Sets the value at the specified path in the object itself (side effect), creating the missing intermediate objects
 * (null or non-object intermediate values are replaced with new objects).
 * When excludeEmpty is true, empty values are not set.
 */
export const setInPath = <T extends object>(params: {
  obj: T
  path: string[]
  value: unknown
  excludeEmpty?: boolean
}): T => {
  const { obj, path, value, excludeEmpty } = params
  if (!excludeEmpty || !isEmpty(value)) {
    let objCurrent: any = obj
    path.forEach((pathPart, i) => {
      if (i === path.length - 1) {
        objCurrent[pathPart] = value
      } else {
        const valueCurrent = Object.hasOwn(objCurrent, pathPart) ? objCurrent[pathPart] : undefined
        if (valueCurrent === null || (typeof valueCurrent !== 'object' && typeof valueCurrent !== 'function')) {
          // missing, null or primitive intermediate value: replace it with a new object
          objCurrent[pathPart] = {}
        }
        objCurrent = objCurrent[pathPart]
      }
    })
  }
  return obj
}
