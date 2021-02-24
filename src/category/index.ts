import { Validation } from 'src/validation'

export interface CategoryLevelProps {
  name: string
}

export interface CategoryLevel {
  id: number
  uuid: string
  index: number
  props: CategoryLevelProps
}

export interface CategoryItemExtraDef {
  dataType: 'text' | 'number' | 'geometryPoint'
}

export interface CategoryProps {
  name: string
  itemExtraDef: CategoryItemExtraDef
}

export interface CategoryLevels {
  [key: number]: CategoryLevel
}

export interface Category {
  id: number
  uuid: string
  props: CategoryProps
  published: boolean
  levels: CategoryLevels
  validation: Validation
}
