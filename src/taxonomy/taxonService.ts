import { User } from 'src/auth'
import { JobStatus } from 'src/job'
import { Taxon } from 'src/taxonomy/taxon'

export interface TaxonService {
  // ==== READ
  count(options: { surveyId: string; taxonomyUuid: string; draft?: boolean }): Promise<number>

  getByVernacularName(options: {
    surveyId: string
    taxonomyUuid: string
    filterValue: string
    draft: boolean
    includeUnlUnk: boolean
  }): Promise<Array<Taxon>>

  getByCode(options: {
    surveyId: string
    taxonomyUuid: string
    filterValue: string
    draft: boolean
    includeUnlUnk: boolean
  }): Promise<Array<Taxon>>

  getByScientificName(options: {
    surveyId: string
    taxonomyUuid: string
    filterValue: string
    draft: boolean
    includeUnlUnk: boolean
  }): Promise<Array<Taxon>>

  getByVernacularNames(options: {
    surveyId: string
    taxonomyUuid: string
    draft: boolean
    limit: number
    offset: number
  }): Promise<Array<Taxon>>

  getTaxonVernacularNameByUuid(options: {
    surveyId: string
    vernacularNameUuid: string
    draft: boolean
  }): Promise<Taxon>

  getTaxonByUuid(options: { surveyId: string; taxonUuid: string; draft: boolean }): Promise<Taxon>

  // ==== UPDATE

  importTaxa(options: { user: User; surveyId: string; taxonomyUuid: string; filePath: string }): Promise<JobStatus<any>>
}
