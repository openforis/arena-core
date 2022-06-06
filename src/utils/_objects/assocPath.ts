export const assocPath = (params: { obj: any; path: string[]; value: any; sideEffect?: boolean }): any => {
  const { obj, path, value, sideEffect = false } = params

  let objUpdated = sideEffect ? obj : { ...obj }

  if (path.length === 0) return objUpdated

  const [firstPathPart, ...otherPathParts] = path

  if (path.length === 1) {
    objUpdated[firstPathPart] = value
    return objUpdated
  }

  const objPart = obj[firstPathPart] || {}
  let objPartUpdated = sideEffect ? { ...objPart } : objPart
  objPartUpdated = assocPath({ obj: objPartUpdated, path: otherPathParts, value, sideEffect })

  if (sideEffect) {
    objUpdated[firstPathPart] = objPartUpdated
  } else {
    objUpdated = {
      ...obj,
      [firstPathPart]: objPartUpdated,
    }
  }
  return objUpdated
}
