import { ArenaRecordNode } from '../../node'
import { NodesUpdateParams } from './recordNodesCreator'

export interface RecordNodeDependentsUpdateParams extends NodesUpdateParams {
  node: ArenaRecordNode
}
