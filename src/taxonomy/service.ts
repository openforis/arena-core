import { JobStatus } from '../job/status'
import { User } from '../auth'
import { Taxonomy, TaxonomyProps } from './taxonomy'

export interface TaxonomyService {
  // ==== CREATE
  create(options: { user: User; surveyId: string; taxonomy: Taxonomy }): Promise<Taxonomy>

  // ==== READ
  count(options: { surveyId: string }): Promise<number>

  getMany(options: {
    draft?: boolean
    limit?: number
    offset?: number
    search?: string
    surveyId: string
    validate?: boolean
  }): Promise<Array<Taxonomy>>

  get(options: { surveyId: string; taxonomyUuid: string; draft: boolean; validate: boolean }): Promise<Taxonomy>

  // ==== UPDATE

  update(options: { user: User; surveyId: string; taxonomyUuid: string; props: TaxonomyProps }): Promise<void>

  // ==== DELETE
  delete(options: { user: User; surveyId: string; taxonomyUuid: string }): void
}
