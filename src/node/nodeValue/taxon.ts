import { NodeValueComposite } from './nodeValueComposite'

export interface ArenaRecordNodeValueTaxon extends NodeValueComposite {
  taxonUuid: string
  code?: string
  scientificName?: string
  vernacularName?: string
  vernacularNameUuid?: string
}
