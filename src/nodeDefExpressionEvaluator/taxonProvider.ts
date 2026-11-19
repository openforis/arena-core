import { ArenaSurvey } from '../survey'
import { ArenaTaxon } from '../taxonomy'

export interface ArenaTaxonProvider {
  getTaxonByCode: (params: {
    survey: ArenaSurvey
    taxonomyUuid: string
    taxonCode: string
    draft: boolean
  }) => Promise<ArenaTaxon | undefined>
  getTaxonByUuid: (params: {
    survey: ArenaSurvey
    taxonomyUuid: string
    taxonUuid: string
    draft: boolean
  }) => Promise<ArenaTaxon | undefined>
}
