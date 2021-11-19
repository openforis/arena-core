import { ArenaObject } from '../common'
import { VernacularName } from './taxonVernacularName'

export interface TaxonProps {
  code: string
  family: string
  genus: string
  scientificName: string
  extra?: { [key: string]: any }
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
