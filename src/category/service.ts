import { User } from 'src/auth'
import { Category } from './category'
import { CategoryLevel } from './level'
import { CategoryItem } from './item'

export interface CategoryImportJob {
  // Todo
}

export interface CategoryService {
  // ==== CREATE
  create(options: { surveyId: string; category: Category; user: User }): Promise<Category>

  createImportSummary(filePath: string): Promise<{ [key: string]: any }>

  createImportCategory(
    user: User,
    surveyId: string,
    categoryUuid: string,
    summary: { [key: string]: any }
  ): Promise<CategoryImportJob>

  createLevel(options: {
    user: User
    surveyId: string
    level: any
  }): Promise<{ level: CategoryLevel; category: Category }>

  createItem(
    user: User,
    surveyId: string,
    categoryUuid: string,
    itemReq: CategoryItem
  ): Promise<{ item: CategoryItem; category: Category }>

  // ==== READ
  count(options: { user: User; draft: boolean }): Promise<number>

  getMany(options: {
    surveyId: string
    draft: boolean
    includeValidation: boolean
    offset: number
    limit: number
    search: string
  }): Promise<Array<Category>>

  get(surveyId: string, categoryUuid: string, draft: boolean, validate: boolean): Promise<Category>

  fetchItemsByParentUuid(
    surveyId: string,
    categoryUuid: string,
    parentUuid?: string,
    draft?: boolean
  ): Promise<Array<CategoryItem>>

  // ==== UPDATE
  updateCategoryProp(
    user: User,
    surveyId: string,
    categoryUuid: string,
    key: string,
    value: any,
    system?: boolean
  ): Promise<Category>

  updateLevelProp(
    user: User,
    surveyId: string,
    categoryUuid: string,
    levelUuid: string,
    key: string,
    value: any
  ): Promise<{ level: CategoryLevel; category: Category }>

  updateItemProp(
    user: User,
    surveyId: string,
    categoryUuid: string,
    itemUuid: string,
    key: string,
    value: any
  ): Promise<{ item: CategoryItem; category: Category }>

  // ==== DELETE
  deleteCategory(user: User, surveyId: string, categoryUuid: string): Promise<void>

  deleteLevel(user: User, surveyId: string, categoryUuid: string, levelUuid: string): Promise<Category>

  deleteItem(user: User, surveyId: string, categoryUuid: string, itemUuid: string): Promise<Category>
}
