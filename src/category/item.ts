import { ArenaObject } from '../common'
import { Labels } from '../language'

export interface CategoryItemProps {
  code?: string
  extra?: { [key: string]: any }
  labels?: Labels
}

export interface CategoryItem extends ArenaObject<CategoryItemProps> {
  draft?: boolean
  id?: number
  index?: number
  levelUuid?: string
  parentUuid?: string
  published?: boolean
}
