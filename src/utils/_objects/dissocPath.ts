import { isEmpty } from './isEmpty'

export const dissocPath = <T extends object>(params: { obj: T; path: string[]; sideEffect?: boolean }): T => {
  const { obj, path, sideEffect = false } = params
  const objUpdated = sideEffect ? obj : { ...obj }

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

  const objPartUpdated = dissocPath({ obj: sideEffect ? objPart : { ...objPart }, path: otherPathParts, sideEffect })

  if (isEmpty(objPartUpdated)) {
    delete objUpdated[firstPathPart]
    return objUpdated
  }

  objUpdated[firstPathPart] = objPartUpdated
  return objUpdated
}
