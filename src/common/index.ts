import { Validation } from '../validation'

export interface ArenaObject<T> {
  readonly uuid: string
  props: T
  validation?: Validation
}

export type { Factory } from './factory'

export { TraverseMethod } from './traverseMethod'
