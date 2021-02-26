import { ArenaObject } from 'src/common'
import { Labels } from 'src/labels'

export interface CategoryItemProps {
  code: string
  labels: Labels
  extra?: { [key: string]: any }
}

export interface CategoryItem extends ArenaObject<CategoryItemProps> {
  id: number
  levelUuid: string
  parentUuid?: string
  published: boolean
  draft: boolean
}
