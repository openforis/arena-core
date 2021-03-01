import { Validation } from '../validation'

export interface ArenaObject<T> {
  uuid: string
  props: T
  validation?: Validation
}
