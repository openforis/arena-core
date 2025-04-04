import { ArenaObject, Dictionary } from '../common'
import { ExtraPropDefs } from '../extraProp'
import { CategoryLevel } from './level'

export interface CategoryProps {
  itemExtraDef?: ExtraPropDefs
  name?: string
}

export interface Category extends ArenaObject<CategoryProps> {
  id?: number
  levels: Dictionary<CategoryLevel>
  published?: boolean
}
