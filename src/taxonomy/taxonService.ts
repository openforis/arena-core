import { User } from '../auth'
import { JobSummary } from '../job'
import { Taxon } from './taxon'
import { VernacularName } from './taxonVernacularName'

export interface TaxonService {
  // ==== READ
  count(options: { surveyId: number; taxonomyUuid: string; draft?: boolean }): Promise<number>

  get(options: { surveyId: number; taxonomyUuid: string; taxonUuid?: string; draft?: boolean }): Promise<Taxon>

  getMany(options: {
    draft?: boolean
    limit?: number
    offset?: number
    searchField?: 'code' | 'scientificName' | 'vernacularNames'
    searchValue?: string
    surveyId: number
    taxonomyUuid: string
    includeUnlUnk?: boolean
  }): Promise<Array<Taxon>>

  getManyVernacularNames(options: {
    draft?: boolean
    surveyId: number
    vernacularNameUuid: string
  }): Promise<Array<VernacularName>>

  // ==== UPDATE

  importTaxa(options: {
    user: User
    surveyId: number
    taxonomyUuid: string
    filePath: string
  }): Promise<JobSummary<any>>
}
