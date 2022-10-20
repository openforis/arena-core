import { assocPath } from './assocPath'

export const assoc = (params: { obj: any; prop: string; value: any; sideEffect?: boolean }): any => {
  const { obj, prop, value, sideEffect = false } = params
  return assocPath({ obj, path: [prop], value, sideEffect })
}
