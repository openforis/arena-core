import { Labels } from '../labels'
import { ArenaObject } from '../common'
import { Validation } from '../validation'

export interface TaxonomyProps {
  descriptions?: Labels
  name: string
  vernacularLanguageCodes: Array<string>
}

export interface Taxonomy extends ArenaObject<TaxonomyProps> {
  draft: boolean
  id: string
  published: boolean
  validation?: Validation
}
