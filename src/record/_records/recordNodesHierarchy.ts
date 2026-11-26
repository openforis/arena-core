import { ArenaRecordNode } from '../../node'

type NodesByUuid = { [uuid: string]: ArenaRecordNode }

/**
 * Returns the uuids of the ancestors of the specified node (root first), found going up the parent uuids.
 * It stops at the first ancestor not found among the specified nodes.
 */
export const getAncestorUuids = (node: ArenaRecordNode, nodesByUuid: NodesByUuid): string[] => {
  const ancestorUuids: string[] = []
  let parentUuid = node.parentUuid
  while (parentUuid) {
    ancestorUuids.push(parentUuid)
    parentUuid = nodesByUuid[parentUuid]?.parentUuid
  }
  return ancestorUuids.reverse()
}

/**
 * Returns true if the ancestor is found going up the parent uuids of the specified node.
 */
export const isDescendantOf = (node: ArenaRecordNode, ancestorUuid: string, nodesByUuid: NodesByUuid): boolean => {
  let parentUuid = node.parentUuid
  while (parentUuid) {
    if (parentUuid === ancestorUuid) return true
    parentUuid = nodesByUuid[parentUuid]?.parentUuid
  }
  return false
}

/**
 * Creates a function returning the depth of a node (number of ancestors), found going up the parent uuids.
 * The depths are cached: use it to compare many nodes (e.g. when sorting them).
 */
export const createNodeDepthGetter = (nodesByUuid: NodesByUuid): ((node: ArenaRecordNode) => number) => {
  const depthByUuid = new Map<string, number>()
  const getDepth = (node: ArenaRecordNode): number => {
    const cached = depthByUuid.get(node.uuid)
    if (cached !== undefined) return cached
    const parent = node.parentUuid ? nodesByUuid[node.parentUuid] : undefined
    let depth = 0
    if (parent) {
      depth = getDepth(parent) + 1
    } else if (node.parentUuid) {
      depth = 1
    }
    depthByUuid.set(node.uuid, depth)
    return depth
  }
  return getDepth
}
