import { ArenaUser } from '../auth'
import { ArenaService } from '../common'
import { ArenaJobSerialized } from '../job'
import { ArenaTaxon } from './taxon'
import { ArenaVernacularName } from './taxonVernacularName'

export interface ArenaTaxonService extends ArenaService {
  // ==== READ
  count(options: { surveyId: number; taxonomyUuid: string; draft?: boolean }): Promise<number>

  get(options: { surveyId: number; taxonomyUuid: string; taxonUuid?: string; draft?: boolean }): Promise<ArenaTaxon>

  getMany(options: {
    draft?: boolean
    limit?: number
    offset?: number
    searchField?: 'code' | 'scientificName' | 'vernacularNames'
    searchValue?: string
    surveyId: number
    taxonomyUuid: string
    includeUnlUnk?: boolean
  }): Promise<Array<ArenaTaxon>>

  getManyVernacularNames(options: {
    draft?: boolean
    surveyId: number
    vernacularNameUuid: string
  }): Promise<Array<ArenaVernacularName>>

  // ==== UPDATE

  importTaxa(options: {
    user: ArenaUser
    surveyId: number
    taxonomyUuid: string
    filePath: string
  }): Promise<ArenaJobSerialized<any>>
}
