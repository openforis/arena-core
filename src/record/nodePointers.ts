import { ArenaRecordNode, ArenaRecordNodePointer } from '../node'
import { ArenaRecord } from './record'
import { Records } from './records'

const getNodesFromNodePointers = (params: {
  record: ArenaRecord
  nodePointers: ArenaRecordNodePointer[]
}): ArenaRecordNode[] => {
  const { record, nodePointers } = params

  return nodePointers.flatMap((nodePointer) =>
    Records.getChildren(nodePointer.nodeCtx, nodePointer.nodeDef.uuid)(record)
  )
}

const getNodesMapFromNodePointers = (params: {
  record: ArenaRecord
  nodePointers: ArenaRecordNodePointer[]
}): { [key: string]: ArenaRecordNode } => {
  const nodes = getNodesFromNodePointers(params)
  const nodesMap: { [key: string]: ArenaRecordNode } = {}
  for (const node of nodes) {
    nodesMap[node.uuid] = node
  }
  return nodesMap
}

export const NodePointers = {
  getNodesFromNodePointers,
  getNodesMapFromNodePointers,
}
