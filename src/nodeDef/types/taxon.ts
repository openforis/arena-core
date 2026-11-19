import { ArenaNodeDef, ArenaNodeDefProps, NodeDefType } from '../nodeDef'

export interface ArenaNodeDefTaxonProps extends ArenaNodeDefProps {
  taxonomyUuid: string
  vernacularNameSelectionKept?: boolean
  vernacularNameAlwaysIncludedIfSingle?: boolean
}

export type ArenaNodeDefTaxon = ArenaNodeDef<NodeDefType.taxon, ArenaNodeDefTaxonProps>
