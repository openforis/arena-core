import { dissocPath } from './dissocPath'

export const dissoc = (params: { obj: any; prop: string; sideEffect?: boolean }): any => {
  const { obj, prop, sideEffect } = params
  return dissocPath({ obj, path: [prop], sideEffect })
}
