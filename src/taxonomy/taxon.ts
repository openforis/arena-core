import { ArenaObject } from 'src/common'

export interface VernacularNamesLanguageProps {
  lang: string
  name: string
}

export interface VernacularNamesLanguage extends ArenaObject<VernacularNamesLanguageProps> {}

export interface VernacularNames {
  [key: string]: VernacularNamesLanguage[]
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
