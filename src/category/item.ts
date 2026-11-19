import { ArenaObject, ArenaDictionary } from '../common'
import { ArenaLabels } from '../language'

export interface ArenaCategoryItemProps {
  code?: string
  extra?: ArenaDictionary<any>
  index?: number
  labels?: ArenaLabels
}

export interface ArenaCategoryItem extends ArenaObject<ArenaCategoryItemProps> {
  draft?: boolean
  id?: number
  levelUuid?: string
  parentUuid?: string
  published?: boolean
}
