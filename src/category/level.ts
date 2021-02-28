import { ArenaObject } from 'src/common'

export interface CategoryLevelProps {
  name: string
}

export interface CategoryLevel extends ArenaObject<CategoryLevelProps> {
  id: number
  index: number
}

export interface CategoryLevels {
  [key: number]: CategoryLevel
}
