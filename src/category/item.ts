import { ArenaObject } from 'src/common'
import { Labels } from 'src/language'

export interface CategoryItemProps {
  code?: string
  extra?: { [key: string]: any }
  labels?: Labels
}

export interface CategoryItem extends ArenaObject<CategoryItemProps> {
  draft?: boolean
  id?: number
  levelUuid?: string
  parentUuid?: string
  published?: boolean
}
