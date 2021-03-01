import { ArenaObject } from 'src/common'
import { CategoryLevel } from './level'

export enum CategoryItemExtraDefDataType {
  text = 'text',
  number = 'number',
  geometryPoint = 'geometryPoint',
}

export interface CategoryItemExtraDef {
  dataType: CategoryItemExtraDefDataType
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
