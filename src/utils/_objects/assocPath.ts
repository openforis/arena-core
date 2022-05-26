import { isEmpty } from './isEmpty'

export const assocPath = (params: { obj: any; path: string[]; value: any; excludeEmpty?: boolean }): any => {
  const { obj, path, value, excludeEmpty } = params
  if (excludeEmpty && isEmpty(value) || path.length === 0) {
    return {...obj}
  }

  const objUpdated = {...obj}
  const [firstPathPart, ...otherPathParts] = path
  const objCurrent = objUpdated[firstPathPart]
  
  return assocPath({obj, })
}
