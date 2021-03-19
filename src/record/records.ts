import { NodeDef } from 'src/nodeDef'
import { Node } from '../node'
import { Record } from './record'

const getNodes = (record: Record): Node[] => Object.values(record.nodes || {})

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

const getParent = (params: { record: Record; node: Node }): Node | undefined => {
  const { record, node } = params
  const nodes = getNodes(record)
  const parent = nodes.find((n) => n.uuid === node.parentUuid)
  return parent
}

const getAncestor = (params: { record: Record; node: Node; ancestorDefUuid: string }): Node => {
  const { record, node, ancestorDefUuid } = params
  let ancestor = getParent({ record, node })
  while (ancestor && ancestor.nodeDefUuid !== ancestorDefUuid) {
    ancestor = getParent({ record, node: ancestor })
  }
  if (!ancestor) {
    throw new Error(`Uncestor with ancestorDefUuid ${ancestorDefUuid} not found`)
  }
  return ancestor
}

const getDescendant = (params: { record: Record; node: Node; nodeDefDescendant: NodeDef<any> }): Node => {
  const { record, node, nodeDefDescendant } = params
  // starting from node, visit descendant entities up to referenced node parent entity
  const nodeDescendantH = nodeDefDescendant.meta.h
  const descendant = nodeDescendantH
    .slice(nodeDescendantH.indexOf(node.nodeDefUuid) + 1)
    .reduce((parentNode, childDefUuid) => getChild({ record, parentNode, childDefUuid }), node)
  return descendant
}

export const Records = { getRoot, getChild, getChildren, getParent, getAncestor, getDescendant }
