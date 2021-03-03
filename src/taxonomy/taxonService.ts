import { User } from 'src/auth'
import { JobStatus } from 'src/job'
import { Taxon } from 'src/taxonomy/taxon'
import { VernacularName } from './taxonVernacularName'

export interface TaxonService {
  // ==== READ
  count(options: { surveyId: number; taxonomyUuid: string; draft?: boolean }): Promise<number>

  get(options: { surveyId: string; taxonomyUuid: string; taxonUuid?: string; draft?: boolean }): Promise<Taxon>

  getMany(options: {
    draft?: boolean
    limit?: number
    offset?: number
    searchField?: 'code' | 'scientificName' | 'vernacularNames'
    searchValue?: string
    surveyId: string
    taxonomyUuid: string
    uncludeUnlUnk?: boolean
  }): Promise<Array<Taxon>>

  getManyVernacularNames(options: {
    draft?: boolean
    surveyId: number
    vernacularNameUuid: string
  }): Promise<Array<VernacularName>>

  // ==== UPDATE

  importTaxa(options: { user: User; surveyId: number; taxonomyUuid: string; filePath: string }): Promise<JobStatus<any>>
}
