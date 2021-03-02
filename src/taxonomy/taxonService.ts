import { User } from 'src/auth'
import { JobStatus } from 'src/job'
import { Taxon } from 'src/taxonomy/taxon'

export interface TaxonService {
  // ==== READ
  count(options: { surveyId: number; taxonomyUuid: string; draft?: boolean }): Promise<number>

  getByVernacularName(options: {
    surveyId: number
    taxonomyUuid: string
    filterValue: string
    draft: boolean
    includeUnlUnk: boolean
  }): Promise<Array<Taxon>>

  getByCode(options: {
    surveyId: number
    taxonomyUuid: string
    filterValue: string
    draft: boolean
    includeUnlUnk: boolean
  }): Promise<Array<Taxon>>

  getByScientificName(options: {
    surveyId: number
    taxonomyUuid: string
    filterValue: string
    draft: boolean
    includeUnlUnk: boolean
  }): Promise<Array<Taxon>>

  getByVernacularNames(options: {
    surveyId: number
    taxonomyUuid: string
    draft: boolean
    limit: number
    offset: number
  }): Promise<Array<Taxon>>

  getTaxonVernacularNameByUuid(options: {
    surveyId: number
    vernacularNameUuid: string
    draft: boolean
  }): Promise<Taxon>

  getTaxonByUuid(options: { surveyId: number; taxonUuid: string; draft: boolean }): Promise<Taxon>

  // ==== UPDATE

  importTaxa(options: { user: User; surveyId: number; taxonomyUuid: string; filePath: string }): Promise<JobStatus<any>>
}
