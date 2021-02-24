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
  [key: number]: Category
}

export interface CategoryValidation {
  valid: boolean
  errors: Array<any>
  fields: { key: any }
  warnings: Array<any>
}

export interface Category {
  id: number
  uuid: string
  props: CategoryProps
  published: boolean
  levels: CategoryLevels
  validation: CategoryValidation
}
