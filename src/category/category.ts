import { ArenaObject } from 'src/common'
import { Validation } from 'src/validation'
import { CategoryLevels } from './level'

export interface CategoryItemExtraDef {
  dataType: 'text' | 'number' | 'geometryPoint'
}

export interface CategoryItemExtraDefs {
  [key: string]: CategoryItemExtraDef
}

export interface CategoryProps {
  itemExtraDefs: CategoryItemExtraDefs
  name: string
}

export interface Category extends ArenaObject<CategoryProps> {
  id: number
  levels: CategoryLevels
  published: boolean
  validation: Validation
}
