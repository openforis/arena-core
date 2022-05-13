import { Node } from '../../node'
import { NodeDef, NodeDefProps, NodeDefType } from '../../nodeDef'

export interface NodePointer {
  nodeCtx: Node
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}
