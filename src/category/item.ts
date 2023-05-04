import { ArenaObject } from '../common'
import { Labels } from '../language'

export interface CategoryItemProps {
  code?: string
  extra?: { [key: string]: any }
  index?: number
  labels?: Labels
}

export interface CategoryItem extends ArenaObject<CategoryItemProps> {
  draft?: boolean
  id?: number
  levelUuid?: string
  parentUuid?: string
  published?: boolean
}
