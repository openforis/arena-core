import { ArenaObject } from 'src/common';
import { Validation } from 'src/validation'

export interface CategoryLevelProps {
  name: string
}

export interface CategoryLevel extends ArenaObject<CategoryLevelProps> {
  id: number
  index: number
}

export interface CategoryItemExtraDef {
  dataType: 'text' | 'number' | 'geometryPoint'
}

export interface CategoryItemExtraDefs {
  [key: string]: CategoryItemExtraDef
}

export interface CategoryProps {
  name: string
  itemExtraDef: CategoryItemExtraDefs
}

export interface CategoryLevels {
  [key: number]: CategoryLevel
}

export interface Category extends ArenaObject<CategoryProps> {
  id: number
  published: boolean
  levels: CategoryLevels
  validation: Validation
}
