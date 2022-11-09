import { isEmpty } from './isEmpty'

export const dissocPath = <T extends object>(params: { obj: T; path: string[] }): T => {
  const { obj, path } = params
  const objUpdated = { ...obj }

  if (path.length === 0) {
    return objUpdated
  }

  const [firstPathPartString, ...otherPathParts] = path
  const firstPathPart = firstPathPartString as keyof typeof objUpdated

  const objPart: any = objUpdated[firstPathPart]

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
