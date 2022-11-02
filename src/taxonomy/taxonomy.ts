import { Labels } from '../language'
import { ArenaObject } from '../common'
import { ExtraPropDefs } from '../extraProp'

export interface TaxonomyProps {
  descriptions?: Labels
  name?: string
  vernacularLanguageCodes?: Array<string>
  extraPropsDefs?: ExtraPropDefs
}

export interface Taxonomy extends ArenaObject<TaxonomyProps> {
  draft?: boolean
  id?: number
  published?: boolean
}
