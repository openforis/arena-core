import { User } from 'src/auth'
import { Category } from './category'
import { CategoryLevel } from './level'
import { CategoryItem } from './item'
import { ImportSummary } from './importSummary'

export interface CategoryImportJob {
  // Todo
}

export interface CategoryService {
  // ==== CREATE
  create(options: { surveyId: string; category: Category; user: User }): Promise<Category>

  createImportSummary(filePath: string): Promise<{ [key: string]: any }>

  createImportCategory(options: {
    categoryUuid: string
    summary: { [key: string]: ImportSummary }
    surveyId: string
    user: User
  }): Promise<CategoryImportJob>

  createLevel(options: {
    level: any
    surveyId: string
    user: User
  }): Promise<{ level: CategoryLevel; category: Category }>

  createItem(options: {
    categoryUuid: string
    itemReq: CategoryItem
    surveyId: string
    user: User
  }): Promise<{ item: CategoryItem; category: Category }>

  // ==== READ
  count(options: { draft: boolean; user: User }): Promise<number>

  getMany(options: {
    draft: boolean
    includeValidation: boolean
    limit: number
    offset: number
    search: string
    surveyId: string
  }): Promise<Array<Category>>

  get(options: { validate: boolean; draft: boolean; categoryUuid: string; surveyId: string }): Promise<Category>

  getItemsByParentUuid(options: {
    categoryUuid: string
    draft?: boolean
    parentUuid?: string
    surveyId: string
  }): Promise<Array<CategoryItem>>

  // ==== UPDATE
  updateCategoryProp(options: {
    categoryUuid: string
    key: string
    surveyId: string
    system?: boolean
    user: User
    value: any
  }): Promise<Category>

  updateLevelProp(options: {
    categoryUuid: string
    key: string
    levelUuid: string
    surveyId: string
    user: User
    value: any
  }): Promise<{ level: CategoryLevel; category: Category }>

  updateItemProp(options: {
    categoryUuid: string
    itemUuid: string
    key: string
    surveyId: string
    user: User
    value: any
  }): Promise<{ item: CategoryItem; category: Category }>

  // ==== DELETE
  deleteCategory(options: { categoryUuid: string; surveyId: string; user: User }): Promise<void>

  deleteLevel(options: { levelUuid: string; categoryUuid: string; surveyId: string; user: User }): Promise<Category>

  deleteItem(options: { itemUuid: string; categoryUuid: string; surveyId: string; user: User }): Promise<Category>
}
