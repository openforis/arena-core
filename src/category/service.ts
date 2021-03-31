import { User } from '../auth'
import { Category, CategoryProps } from './category'
import { CategoryImportSummary } from './categoryImportSummary'
import { JobSummary } from '../job'

export interface CategoryService {
  // ==== CREATE
  create(options: { surveyId: number; category: Category; user: User }): Promise<Category>

  createImportSummary(filePath: string): Promise<CategoryImportSummary>

  createImportCategory(options: {
    categoryUuid: string
    summary: CategoryImportSummary
    surveyId: number
    user: User
  }): Promise<JobSummary<any>>

  // ==== READ
  count(options: { draft?: boolean; user: User }): Promise<number>

  get(options: { validate?: boolean; draft?: boolean; categoryUuid: string; surveyId: number }): Promise<Category>

  getMany(options: {
    draft?: boolean
    validate?: boolean
    limit?: number
    offset?: number
    search?: string
    surveyId: number
  }): Promise<Array<Category>>

  // ==== UPDATE
  update(options: {
    categoryUuid: string
    surveyId: number
    system?: boolean
    user: User
    props: CategoryProps
  }): Promise<Category>

  // ==== DELETE
  delete(options: { categoryUuid: string; surveyId: number; user: User }): Promise<void>
}
