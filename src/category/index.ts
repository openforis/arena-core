import { Validation } from 'src/validation'

export enum CategoryPropsItemExtraDefDataType {
  text = 'text',
  number = 'number',
  geometryPoint = 'geometryPoint',
}

export interface CategoryLevelProp {
  name: string
}

export interface CategoryLevel {
  id: number
  uuid: string
  index: number
  props: CategoryLevelProp
}

export interface CategoryPropsItemExtraDef {
  dataType: CategoryPropsItemExtraDefDataType
}

export interface CategoryProps {
  name: string
  itemExtraDef: CategoryPropsItemExtraDef
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
