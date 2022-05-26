export const assocPath = (params: { obj: any; path: string[]; value: any }): any => {
  const { obj, path, value } = params

  if (path.length === 0) return { ...obj }

  const [firstPathPart, ...otherPathParts] = path

  if (path.length === 1) return { ...obj, [firstPathPart]: value }

  const objPart = { ...(obj[firstPathPart] || {}) }
  const objPartUpdated = assocPath({ obj: objPart, path: otherPathParts, value })

  return {
    ...obj,
    [firstPathPart]: objPartUpdated,
  }
}
