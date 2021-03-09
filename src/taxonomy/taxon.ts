import { ArenaObject } from 'src/common'
import { VernacularName } from '../taxonVernacularName'

export interface TaxonProps {
  code: string
  family: string
  genus: string
  scientificName: string
}

export interface Taxon extends ArenaObject<TaxonProps> {
  id?: number
  taxonomyUuid?: string
  vernacularNames?: {
    [key: string]: Array<VernacularName>
  }
  published?: boolean
  draft?: boolean
}
