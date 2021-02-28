import { ArenaObject } from 'src/common'
import { CategoryLevel } from './level'

export interface CategoryItemExtraDef {
  dataType: 'text' | 'number' | 'geometryPoint'
}

export interface CategoryProps {
  itemExtraDefs?: {
    [name: string]: CategoryItemExtraDef
  }
  name: string
}

export interface Category extends ArenaObject<CategoryProps> {
  id?: number
  levels?: {
    [key: number]: CategoryLevel
  }
  published?: boolean
}
