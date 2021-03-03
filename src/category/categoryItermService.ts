import { User } from 'src/auth'
import { Category } from './category'
import { CategoryItem, CategoryItemProps } from './item'

export interface categoryItermService {
  // ==== CREATE
  create(options: {
    categoryUuid: string
    item: CategoryItem
    surveyId: number
    user: User
  }): Promise<{ item: CategoryItem; category: Category }>

  // ==== READ
  get(options: { validate?: boolean; draft?: boolean; categoryUuid: string; surveyId: number }): Promise<CategoryItem>

  getMany(options: {
    categoryUuid: string
    draft?: boolean
    parentUuid?: string
    surveyId: number
  }): Promise<Array<CategoryItem>>

  // ==== UPDATE
  update(options: {
    categoryUuid: string
    itemUuid: string
    key: string
    surveyId: number
    user: User
    props: CategoryItemProps
  }): Promise<{ item: CategoryItem; category: Category }>

  // ==== DELETE
  deleteItem(options: { itemUuid: string; categoryUuid: string; surveyId: number; user: User }): Promise<Category>
}
