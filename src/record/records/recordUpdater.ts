import { Node } from '../../node'
import { Record } from '../record'
import { RecordNodesIndexUpdater } from './recordNodesIndexUpdater'

import { visitDescendantsAndSelf } from './recordGetters'
import { Objects } from '../../utils'

export const addNodes =
  (nodes: { [key: string]: Node }) =>
  (record: Record): Record => ({
    ...record,
    nodes: Object.assign({}, record.nodes || {}, nodes),
    _nodesIndex: RecordNodesIndexUpdater.addNodes(nodes)(record._nodesIndex || {}),
  })

export const addNode = (node: Node) => (record: Record) => addNodes({ [node.uuid]: node })(record)

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
