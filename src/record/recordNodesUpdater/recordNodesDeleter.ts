import { Node } from '../../node'
import { Objects } from '../../utils'
import { Record } from '../record'
import { visitDescendantsAndSelf } from '../_records/recordGetters'
import { RecordNodesIndexUpdater } from '../_records/recordNodesIndexUpdater'

export const removeNodes =
  (nodes: { [key: string]: Node }) =>
  (record: Record): Record => {
    const recordUpdated = { ...record, nodes: record.nodes ?? {} }
    let indexUpdated = { ...(record._nodesIndex ?? {}) }

    Object.values(nodes).forEach((nodeToRemove) => {
      visitDescendantsAndSelf({
        record: recordUpdated,
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
