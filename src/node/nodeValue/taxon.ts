import { NodeValueComposite } from './nodeValueComposite'

export interface NodeValueTaxon extends NodeValueComposite {
  taxonUuid: string
  code?: string
  scientificName?: string
  vernacularName?: string
  vernacularNameUuid?: string
}
