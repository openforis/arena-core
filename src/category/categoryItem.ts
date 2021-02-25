import { ArenaObject } from 'src/common'

export interface CategoryItemProps {
  code: string
  labels: { [key: string]: string }
  extra?: { [key: string]: any }
}

export interface CategoryItem extends ArenaObject<CategoryItemProps> {
  id: number
  levelUuid: string
  parentUuid?: string
  published: boolean
  draft: boolean
}
