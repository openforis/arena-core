export interface CategoryItemProps {
  code: string
  labels: { [key: string]: string }
  extra?: { dataType: string }
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
