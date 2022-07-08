import { Node } from '../../node'
import { Record } from '../record'
import { RecordNodesIndexUpdater } from './recordNodesIndexUpdater'

import { visitDescendantsAndSelf } from './recordGetters'
import { Objects } from '../../utils'

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

export const removeNodes =
  (nodes: { [key: string]: Node }) =>
  (record: Record): Record => {
    const recordUpdated = { ...record }
    let indexUpdated = { ...(record._nodesIndex || {}) }

    Object.values(nodes).forEach((nodeToRemove) => {
      visitDescendantsAndSelf({
        record,
        node: nodeToRemove,
        visitor: (nodeToRemoveDescendant) => {
          recordUpdated.nodes = Objects.dissoc({ obj: recordUpdated.nodes, prop: nodeToRemove.uuid })
          indexUpdated = RecordNodesIndexUpdater.removeNode(nodeToRemoveDescendant)(indexUpdated)
        },
      })
    })
    recordUpdated._nodesIndex = indexUpdated
    return recordUpdated
  }

export const removeNode = (node: Node) => (record: Record) => removeNodes({ [node.uuid]: node })(record)
