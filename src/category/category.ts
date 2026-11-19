import { ArenaObject, ArenaDictionary } from '../common'
import { ArenaExtraPropDefs } from '../extraProp'
import { ArenaCategoryLevel } from './level'

export interface ArenaCategoryProps {
  itemExtraDef?: ArenaExtraPropDefs
  name?: string
}

export interface ArenaCategory extends ArenaObject<ArenaCategoryProps> {
  id?: number
  levels: ArenaDictionary<ArenaCategoryLevel>
  published?: boolean
}
