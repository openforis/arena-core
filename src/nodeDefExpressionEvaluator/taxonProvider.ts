import { Survey } from '../survey'
import { Taxon } from '../taxonomy'

export interface TaxonProvider {
  getTaxonByCode: (params: {
    survey: Survey
    taxonomyUuid: string
    taxonCode: string
    draft: boolean
  }) => Promise<Taxon | undefined>
  getTaxonByUuid: (params: {
    survey: Survey
    taxonomyUuid: string
    taxonUuid: string
    draft: boolean
  }) => Promise<Taxon | undefined>
}
