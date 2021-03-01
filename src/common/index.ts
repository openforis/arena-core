import { Validation } from '../validation'

export interface ArenaObject<T> {
  readonly uuid: string
  props: T
  validation?: Validation
}
