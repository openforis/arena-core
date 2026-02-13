import { isEmpty } from './isEmpty'

export const setInPath = (params: { obj: any; path: string[]; value: any; excludeEmpty?: boolean }): any => {
  const { obj, path, value, excludeEmpty } = params
  if (excludeEmpty && isEmpty(value)) {
    return obj
  }

  let objCurrent: any = obj
  for (let index = 0; index < path.length; index++) {
    const pathPart = path[index]
    if (index === path.length - 1) {
      objCurrent[pathPart] = value
    } else {
      if (!Object.prototype.hasOwnProperty.call(objCurrent, pathPart)) {
        objCurrent[pathPart] = {}
      }
      objCurrent = objCurrent[pathPart]
    }
  }
  return obj
}
