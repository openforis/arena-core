import { ArenaUser } from '../auth'
import { ArenaService } from '../common'
import { ArenaCategory } from './category'
import { ArenaCategoryLevel, ArenaCategoryLevelProps } from './level'

export interface ArenaCategoryLevelService extends ArenaService {
  // ==== CREATE
  create(options: {
    level: any
    surveyId: number
    user: ArenaUser
  }): Promise<{ level: ArenaCategoryLevel; category: ArenaCategory }>

  // ==== READ
  get(options: {
    validate?: boolean
    draft?: boolean
    categoryUuid: string
    surveyId: number
  }): Promise<ArenaCategoryLevel>

  getMany(options: {
    draft?: boolean
    validate?: boolean
    limit?: number
    offset?: number
    search?: string
    surveyId: number
  }): Promise<Array<ArenaCategoryLevel>>

  // ==== UPDATE
  update(options: {
    categoryUuid: string
    levelUuid: string
    surveyId: number
    user: ArenaUser
    props: ArenaCategoryLevelProps
  }): Promise<{ level: ArenaCategoryLevel; category: ArenaCategory }>

  // ==== DELETE
  delete(options: {
    levelUuid: string
    categoryUuid: string
    surveyId: number
    user: ArenaUser
  }): Promise<ArenaCategory>
}
