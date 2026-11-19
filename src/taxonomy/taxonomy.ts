import { ArenaLabels } from '../language'
import { ArenaObject } from '../common'
import { ArenaExtraPropDefs } from '../extraProp'

export interface ArenaTaxonomyProps {
  descriptions?: ArenaLabels
  name?: string
  vernacularLanguageCodes?: Array<string>
  extraPropsDefs?: ArenaExtraPropDefs
}

export interface ArenaTaxonomy extends ArenaObject<ArenaTaxonomyProps> {
  draft?: boolean
  id?: number
  published?: boolean
}
