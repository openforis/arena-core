import { dissocPath } from './dissocPath'
import { isEmpty } from './isEmpty'
import { path } from './path'

export const dissocPathIfEmpty = <T extends object>(params: { obj: T; path: string[]; sideEffect?: boolean }): T => {
  const { obj, path: pathParam } = params
  if (isEmpty(path(pathParam)(obj))) {
    return dissocPath(params)
  }
  return obj
}
