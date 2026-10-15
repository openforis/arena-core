const _assocPath = (obj: any, path: string[], pathIndex: number, value: any, sideEffect: boolean): any => {
  // only one copy per path level (when sideEffect is false)
  const objUpdated = sideEffect ? obj : { ...obj }
  if (pathIndex >= path.length) return objUpdated

  const pathPart = path[pathIndex]
  objUpdated[pathPart] =
    pathIndex === path.length - 1 ? value : _assocPath(obj?.[pathPart] || {}, path, pathIndex + 1, value, sideEffect)
  return objUpdated
}

/**
 * Sets the value at the specified path, creating the missing intermediate objects.
 * Returns a copy of the object (with one copy per path level), or the object itself when sideEffect is true.
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
