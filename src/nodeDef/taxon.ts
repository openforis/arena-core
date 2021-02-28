import { NodeDef, NodeDefProps, NodeDefType } from './nodeDef'

export interface NodeDefTaxonProps extends NodeDefProps {
  taxonomyUuid: string
}

export type NodeDefTaxon = NodeDef<NodeDefType.taxon, NodeDefTaxonProps>
