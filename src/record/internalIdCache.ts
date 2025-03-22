import { Dictionary } from '../common'

export interface InternalIdCache {
  idByUuid?: Dictionary<number>
  uuidById?: Dictionary<string>
  lastId?: number
}
