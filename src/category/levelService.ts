import { User } from '../auth'
import { Category } from './category'
import { CategoryLevel, CategoryLevelProps } from './level'

export interface CategoryLevelService {
  // ==== CREATE
  create(options: { level: any; surveyId: number; user: User }): Promise<{ level: CategoryLevel; category: Category }>

  // ==== READ
  get(options: { validate?: boolean; draft?: boolean; categoryUuid: string; surveyId: number }): Promise<CategoryLevel>

  getMany(options: {
    draft?: boolean
    validate?: boolean
    limit?: number
    offset?: number
    search?: string
    surveyId: number
  }): Promise<Array<CategoryLevel>>

  // ==== UPDATE
  update(options: {
    categoryUuid: string
    levelUuid: string
    surveyId: number
    user: User
    props: CategoryLevelProps
  }): Promise<{ level: CategoryLevel; category: Category }>

  // ==== DELETE
  delete(options: { levelUuid: string; categoryUuid: string; surveyId: number; user: User }): Promise<Category>
}
