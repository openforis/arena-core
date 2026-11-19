export type { ArenaDictionary } from './Dictionary'
export type { ArenaI18n } from './i18n'

import { ArenaValidation } from '../validation'

export interface ArenaObject<T> {
  readonly uuid: string
  props: T
  propsDraft?: T
  validation?: ArenaValidation
}

export type { ArenaFactory } from './factory'

export enum TraverseMethod {
  bfs = 'bfs',
  dfs = 'dfs',
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- marker interface extended by every service
export interface ArenaService {}
