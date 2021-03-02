import { JobStatus } from '../job/status'
import { User } from '../auth'
import { Taxonomy, TaxonomyProps } from './taxonomy'

export interface TaxonomyService {
  // ==== CREATE
  create(options: { user: User; surveyId: number; taxonomy: Taxonomy }): Promise<Taxonomy>

  // ==== READ
  count(options: { surveyId: number }): Promise<number>

  getMany(options: {
    draft?: boolean
    limit?: number
    offset?: number
    search?: string
    surveyId: number
    validate?: boolean
  }): Promise<Array<Taxonomy>>

  get(options: { surveyId: number; taxonomyUuid: string; draft: boolean; validate: boolean }): Promise<Taxonomy>

  // ==== UPDATE

  update(options: { user: User; surveyId: number; taxonomyUuid: string; props: TaxonomyProps }): Promise<void>

  // ==== DELETE
  delete(options: { user: User; surveyId: number; taxonomyUuid: string }): void
}
