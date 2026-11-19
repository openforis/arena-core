import { ArenaUser } from '../auth'
import { ArenaService } from '../common'
import { ArenaTaxonomy, ArenaTaxonomyProps } from './taxonomy'

export interface ArenaTaxonomyService extends ArenaService {
  // ==== CREATE
  create(options: { user: ArenaUser; surveyId: number; taxonomy: ArenaTaxonomy }): Promise<ArenaTaxonomy>

  // ==== READ
  count(options: { surveyId: number }): Promise<number>

  getMany(options: {
    draft?: boolean
    limit?: number
    offset?: number
    search?: string
    surveyId: number
    validate?: boolean
  }): Promise<Array<ArenaTaxonomy>>

  get(options: { surveyId: number; taxonomyUuid: string; draft?: boolean; validate?: boolean }): Promise<ArenaTaxonomy>

  // ==== UPDATE

  update(options: { user: ArenaUser; surveyId: number; taxonomyUuid: string; props: ArenaTaxonomyProps }): Promise<void>

  // ==== DELETE
  delete(options: { user: ArenaUser; surveyId: number; taxonomyUuid: string }): void
}
