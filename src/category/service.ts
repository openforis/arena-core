import { ArenaUser } from '../auth'
import { ArenaService } from '../common'
import { ArenaJobSerialized } from '../job'
import { ArenaCategory, ArenaCategoryProps } from './category'
import { ArenaCategoryImportSummary } from './categoryImportSummary'

export interface ArenaCategoryService extends ArenaService {
  // ==== CREATE
  create(options: { surveyId: number; category: ArenaCategory; user: ArenaUser }): Promise<ArenaCategory>

  createImportSummary(filePath: string): Promise<ArenaCategoryImportSummary>

  createImportCategory(options: {
    categoryUuid: string
    summary: ArenaCategoryImportSummary
    surveyId: number
    user: ArenaUser
  }): Promise<ArenaJobSerialized<any>>

  // ==== READ
  count(options: { draft?: boolean; user: ArenaUser }): Promise<number>

  get(options: { validate?: boolean; draft?: boolean; categoryUuid: string; surveyId: number }): Promise<ArenaCategory>

  getMany(options: {
    draft?: boolean
    validate?: boolean
    limit?: number
    offset?: number
    search?: string
    surveyId: number
  }): Promise<Array<ArenaCategory>>

  // ==== UPDATE
  update(options: {
    categoryUuid: string
    surveyId: number
    system?: boolean
    user: ArenaUser
    props: ArenaCategoryProps
  }): Promise<ArenaCategory>

  // ==== DELETE
  delete(options: { categoryUuid: string; surveyId: number; user: ArenaUser }): Promise<void>
}
