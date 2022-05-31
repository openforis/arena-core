import { Node, NodePointer } from '../node'
import { Record } from './record'
import { Records } from './records'

const getNodesFromNodePointers = (params: { record: Record; nodePointers: NodePointer[] }): Node[] => {
  const { record, nodePointers } = params

  return nodePointers.flatMap((nodePointer) =>
    Records.getChildren(nodePointer.nodeCtx, nodePointer.nodeDef.uuid)(record)
  )
}

export const NodePointers = {
  getNodesFromNodePointers,
}
