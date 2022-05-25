import { Node, NodePointer } from '../node'
import { Record } from './record'
import { Records } from './records'

const getNodesFromNodePointers = (params: { record: Record; nodePointers: NodePointer[] }): Node[] => {
  const { record, nodePointers } = params

  return nodePointers.flatMap((nodePointer) =>
    Records.getChildren({ record, parentNode: nodePointer.nodeCtx, childDefUuid: nodePointer.nodeDef.uuid })
  )
}

export const NodePointers = {
  getNodesFromNodePointers,
}
