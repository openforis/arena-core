import { Node, NodePointer, NodesMap } from '../node'
import { Record } from './record'
import { Records } from './records'

const getNodesFromNodePointers = (params: { record: Record; nodePointers: NodePointer[] }): Node[] => {
  const { record, nodePointers } = params

  return nodePointers.flatMap((nodePointer) =>
    Records.getChildren(nodePointer.nodeCtx, nodePointer.nodeDef.uuid)(record)
  )
}

const getNodesMapFromNodePointers = (params: { record: Record; nodePointers: NodePointer[] }): NodesMap => {
  const nodes = getNodesFromNodePointers(params)
  const nodesMap: NodesMap = {}
  for (const node of nodes) {
    nodesMap[node.iId] = node
  }
  return nodesMap
}

export const NodePointers = {
  getNodesFromNodePointers,
  getNodesMapFromNodePointers,
}
