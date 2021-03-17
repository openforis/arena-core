import { Node } from '../node'
import { Record } from './record'

const getNodes = (record: Record) => Object.values(record.nodes || {})

const getRoot = (record: Record): Node => {
  const root = getNodes(record).find((node) => !node.parentUuid)
  if (!root) throw new Error('Record root not found')
  return root
}

const getChildren = (params: { record: Record; parentNode: Node; childDefUuid: string }): Node[] => {
  const { record, childDefUuid, parentNode } = params
  return getNodes(record).filter((node) => node.parentUuid === parentNode.uuid && node.nodeDefUuid == childDefUuid)
}

const getChild = (params: { record: Record; parentNode: Node; childDefUuid: string }): Node => {
  const children = getChildren(params)
  if (children.length > 1) throw new Error('Multiple nodes found')
  if (children.length === 0) throw new Error('Child not found')
  return children[0]
}

export const Records = { getRoot, getChild, getChildren }
