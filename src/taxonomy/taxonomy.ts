import { Labels } from '../language'
import { ArenaObject } from '../common'

export interface TaxonomyProps {
  descriptions?: Labels
  name: string
  vernacularLanguageCodes?: Array<string>
}

export interface Taxonomy extends ArenaObject<TaxonomyProps> {
  draft?: boolean
  id?: number
  published?: boolean
}
