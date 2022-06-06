import { dissocPath } from './dissocPath'

export const dissoc = (params: { obj: any; prop: string }): any => {
  const { obj, prop } = params
  return dissocPath({ obj, path: [prop] })
}
