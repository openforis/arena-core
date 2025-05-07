import { Node } from '../../node'
import { NodesUpdateParams } from './recordNodesCreator'

export interface RecordNodeDependentsUpdateParams extends NodesUpdateParams {
  node: Node
}
