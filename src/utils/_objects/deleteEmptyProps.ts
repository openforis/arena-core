import { isEmpty } from './isEmpty'

export const deleteEmptyProps = (obj: any): any => {
  Object.entries(obj ?? {}).forEach(([key, value]) => {
    if (isEmpty(value)) {
      delete obj[key]
    }
  })
  return obj
}
