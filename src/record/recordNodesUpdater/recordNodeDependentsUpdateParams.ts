import { ArenaRecordNode } from '../../node'
import { ArenaRecordNodesUpdateParams } from './recordNodesCreator'

export interface RecordNodeDependentsUpdateParams extends ArenaRecordNodesUpdateParams {
  node: ArenaRecordNode
}
