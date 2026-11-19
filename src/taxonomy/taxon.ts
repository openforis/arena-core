import { ArenaObject, ArenaDictionary } from '../common'
import { ArenaVernacularName } from './taxonVernacularName'

export interface ArenaTaxonProps {
  code: string
  family: string
  genus: string
  scientificName: string
  extra?: ArenaDictionary<any>
}

export interface ArenaTaxon extends ArenaObject<ArenaTaxonProps> {
  id?: number
  taxonomyUuid?: string
  vernacularNames?: {
    [key: string]: Array<ArenaVernacularName>
  }
  published?: boolean
  draft?: boolean
  // Cached fields for easier access
  vernacularName?: string
  vernacularLang?: string
}
