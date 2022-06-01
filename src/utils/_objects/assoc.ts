import { assocPath } from './assocPath'

export const assoc = (params: { obj: any; prop: string; value: any }): any => {
  const { obj, prop, value } = params
  return assocPath({ obj, path: [prop], value })
}
