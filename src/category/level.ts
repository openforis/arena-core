import { ArenaObject } from '../common'

export interface CategoryLevelProps {
  name?: string
}

export interface CategoryLevel extends ArenaObject<CategoryLevelProps> {
  categoryUuid?: string
  id?: number
  index?: number
}
