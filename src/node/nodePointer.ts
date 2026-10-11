import { ArenaRecordNode } from './node'
import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'

export interface NodePointer {
  nodeCtx: ArenaRecordNode
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}
