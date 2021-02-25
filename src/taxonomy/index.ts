import { ArenaObject } from 'src/common'
import { Validation } from 'src/validation'

export interface TaxonomyProps {
  name: string
  vernacularLanguageCodes: Array<string>
  descriptions?: { [key: string]: string }
}

export interface Taxonomy extends ArenaObject<TaxonomyProps> {
  id: string
  published: boolean
  draft: boolean
  validation: Validation
}
