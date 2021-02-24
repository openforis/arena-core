export interface CategoryItemPropsExtra {
  dataType: string
}

export interface CategoryItemProps {
  code: string
  labels: { [key: string]: string }
  extra?: CategoryItemPropsExtra
}

export interface CategoryItem {
  id: number
  uuid: string
  levelUuid: string
  parentUuid?: string
  published: boolean
  draft: boolean
  props: CategoryItemProps
}
