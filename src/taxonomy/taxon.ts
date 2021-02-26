import { ArenaObject } from 'src/common'
import { VernacularName } from './taxonVernacularName'

export interface VernacularNames {
  [key: string]: VernacularName[]
}

export interface TaxonProps {
  code: string
  genus: string
  scientificName: string
}

export interface Taxon extends ArenaObject<TaxonProps> {
  id: string
  taxonomyUuid: string
  vernacularNames: VernacularNames
  published: boolean
  draft: boolean
}
