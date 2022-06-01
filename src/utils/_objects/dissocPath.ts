import { isEmpty } from './isEmpty'

export const dissocPath = (params: { obj: object; path: string[] }): object => {
  const { obj, path } = params
  const objUpdated = { ...obj }

  if (path.length === 0) {
    return objUpdated
  }

  const [firstPathPartString, ...otherPathParts] = path
  const firstPathPart = firstPathPartString as keyof typeof objUpdated

  const objPart = objUpdated[firstPathPart]

  if (otherPathParts.length === 0 || isEmpty(objPart)) {
    delete objUpdated[firstPathPart]
    return objUpdated
  }

  const objPartUpdated = dissocPath({ obj: objPart, path: otherPathParts })

  if (isEmpty(objPartUpdated)) {
    delete objUpdated[firstPathPart]
    return objUpdated
  }

  return { ...obj, [firstPathPart]: objPartUpdated }
}
