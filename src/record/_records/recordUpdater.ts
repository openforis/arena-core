import { Node } from '../../node'
import { Record } from '../record'
import { RecordNodesIndexUpdater } from './recordNodesIndexUpdater'

export const addNodes =
  (
    nodes: { [key: string]: Node },
    options: { updateNodesIndex: boolean; sideEffect: boolean } = { updateNodesIndex: true, sideEffect: false }
  ) =>
  (record: Record): Record => {
    const { updateNodesIndex = true, sideEffect = false } = options
    const recordUpdated: Record = sideEffect ? record : { ...record }
    if (sideEffect) {
      recordUpdated.nodes = Object.assign(recordUpdated.nodes || {}, nodes)
    } else {
      recordUpdated.nodes = Object.assign({}, recordUpdated.nodes || {}, nodes)
    }
    if (updateNodesIndex) {
      recordUpdated._nodesIndex = RecordNodesIndexUpdater.addNodes(nodes, sideEffect)(recordUpdated._nodesIndex || {})
    }
    return recordUpdated
  }

export const addNode =
  (
    node: Node,
    options: { updateNodesIndex: boolean; sideEffect: boolean } = { updateNodesIndex: true, sideEffect: false }
  ) =>
  (record: Record) =>
    addNodes({ [node.uuid]: node }, options)(record)
