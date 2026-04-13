export type { Dictionary } from './Dictionary'
export type { I18nI } from './i18nI'

import { Validation } from '../validation'

export interface ArenaObject<T> {
  readonly uuid: string
  props: T
  validation?: Validation
}

export type { Factory } from './factory'

export enum TraverseMethod {
  bfs = 'bfs',
  dfs = 'dfs',
}

export interface ArenaService {}
