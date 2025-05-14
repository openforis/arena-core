import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'

export interface NodeDefTaxonProps extends NodeDefProps {
  taxonomyUuid: string
  vernacularNameSelectionKept?: boolean
}

export type NodeDefTaxon = NodeDef<NodeDefType.taxon, NodeDefTaxonProps>
