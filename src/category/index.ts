import { Validation } from "src/validation";

export interface CategoryLevel {
  id: number
  uuid: string
  index: number
  props: string
}

export interface CategoryProps {
  name: string
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
