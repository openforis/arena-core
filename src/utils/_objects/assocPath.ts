import { shallowCopy } from './shallowCopy'

// only own properties are traversed: inherited ones (e.g. "__proto__" or "constructor") would let the path reach
// shared objects like Object.prototype and modify them
const getOwnProp = (obj: any, key: string): any =>
  obj !== null && obj !== undefined && Object.hasOwn(obj, key) ? obj[key] : undefined

// "__proto__" is defined as an own property: assigning it would change the prototype of the object instead
const setOwnProp = (obj: any, key: string, value: any): void => {
  if (key === '__proto__') {
    Object.defineProperty(obj, key, { value, writable: true, enumerable: true, configurable: true })
  } else {
    obj[key] = value
  }
}

const _assocPath = (obj: any, path: string[], pathIndex: number, value: any, sideEffect: boolean): any => {
  // only one copy per path level (when sideEffect is false)
  const objUpdated = sideEffect ? obj : shallowCopy(obj)
  if (pathIndex >= path.length) return objUpdated

  const pathPart = path[pathIndex]
  const valueUpdated =
    pathIndex === path.length - 1
      ? value
      : _assocPath(getOwnProp(obj, pathPart) || {}, path, pathIndex + 1, value, sideEffect)
  setOwnProp(objUpdated, pathPart, valueUpdated)
  return objUpdated
}

/**
 * Sets the value at the specified path, creating the missing intermediate objects.
 * Returns a copy of the object (with one copy per path level), or the object itself when sideEffect is true.
 * Only own properties are traversed and set, so special keys like "__proto__" or "constructor" are treated as
 * ordinary keys (the prototypes of the objects are never modified).
 */
export const assocPath = <T extends object>(params: {
  obj: T
  path: string[]
  value: unknown
  sideEffect?: boolean
}): T => {
  const { obj, path, value, sideEffect = false } = params
  return _assocPath(obj, path, 0, value, sideEffect)
}
