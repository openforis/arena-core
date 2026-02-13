import { isEmpty } from './isEmpty'

export const deleteEmptyProps = (obj: any): any => {
  for (const [key, value] of Object.entries(obj ?? {})) {
    if (isEmpty(value)) {
      delete obj[key]
    }
  }
  return obj
}
