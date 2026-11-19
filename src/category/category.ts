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

/** Alias of Category, not clashing with the Category modules of the consumers. */
export type ArenaCategory = Category
