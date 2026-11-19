import { ArenaRecordNode } from './node'
import { ArenaNodeDef, ArenaNodeDefProps, NodeDefType } from '../nodeDef'

export interface ArenaRecordNodePointer {
  nodeCtx: ArenaRecordNode
  nodeDef: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>
}
