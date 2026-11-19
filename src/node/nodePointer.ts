import { ArenaRecordNode } from './node'
import { ArenaAnyNodeDef } from '../nodeDef'

export interface ArenaRecordNodePointer {
  nodeCtx: ArenaRecordNode
  nodeDef: ArenaAnyNodeDef
}
