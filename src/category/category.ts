import { ArenaObject } from '../common'
import { ExtraPropDefs } from '../extraProp'
import { CategoryLevel } from './level'

export interface CategoryProps {
  itemExtraDefs?: ExtraPropDefs
  name?: string
}

export interface Category extends ArenaObject<CategoryProps> {
  id?: number
  levels: CategoryLevel[]
  published?: boolean
}
