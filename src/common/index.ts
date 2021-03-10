import { Validation } from '../validation'
import { v4 as uuidv4 } from 'uuid'

export interface ArenaObject<T> {
  readonly uuid: string
  props: T
  validation?: Validation
}

export type { Factory } from './factory'

export const uuid = uuidv4
