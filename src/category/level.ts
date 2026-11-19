import { ArenaObject } from '../common'

export interface ArenaCategoryLevelProps {
  name?: string
}

export interface ArenaCategoryLevel extends ArenaObject<ArenaCategoryLevelProps> {
  categoryUuid?: string
  id?: number
  index?: number
}
