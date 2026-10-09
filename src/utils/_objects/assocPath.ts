const _assocPath = (obj: any, path: string[], pathIndex: number, value: any, sideEffect: boolean): any => {
  // only one copy per path level (when sideEffect is false)
  const objUpdated = sideEffect ? obj : { ...obj }
  if (pathIndex >= path.length) return objUpdated

  const pathPart = path[pathIndex]
  objUpdated[pathPart] =
    pathIndex === path.length - 1 ? value : _assocPath(obj?.[pathPart] || {}, path, pathIndex + 1, value, sideEffect)
  return objUpdated
}

export const assocPath = (params: { obj: any; path: string[]; value: any; sideEffect?: boolean }): any => {
  const { obj, path, value, sideEffect = false } = params
  return _assocPath(obj, path, 0, value, sideEffect)
}
