import { ArenaUser } from '../auth'
import { ArenaService } from '../common'
import { ArenaCategory } from './category'
import { ArenaCategoryItem, ArenaCategoryItemProps } from './item'

export interface ArenaCategoryItemService extends ArenaService {
  // ==== CREATE
  create(options: {
    categoryUuid: string
    item: ArenaCategoryItem
    surveyId: number
    user: ArenaUser
  }): Promise<{ item: ArenaCategoryItem; category: ArenaCategory }>

  // ==== READ
  get(options: {
    validate?: boolean
    draft?: boolean
    categoryUuid: string
    surveyId: number
  }): Promise<ArenaCategoryItem>

  getMany(options: {
    categoryUuid: string
    draft?: boolean
    parentUuid?: string
    surveyId: number
  }): Promise<Array<ArenaCategoryItem>>

  // ==== UPDATE
  update(options: {
    categoryUuid: string
    itemUuid: string
    surveyId: number
    user: ArenaUser
    props: ArenaCategoryItemProps
  }): Promise<{ item: ArenaCategoryItem; category: ArenaCategory }>

  // ==== DELETE
  delete(options: { itemUuid: string; categoryUuid: string; surveyId: number; user: ArenaUser }): Promise<ArenaCategory>
}
