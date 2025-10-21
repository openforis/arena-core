import { Node, Nodes } from '../../node'
import { Objects } from '../../utils'
import { Record } from '../record'

const metaHierarchyPath = ['meta', 'h']

interface NodeOld extends Node {
  uuid?: string
  parentUuid?: string
}

const initInternalIds = (params: { record: Record; nodes: NodeOld[] }) => {
  const { record, nodes } = params

  let lastInternalId = 0
  const uuidByInternalId: { [internalId: number]: string } = {}
  const internalIdByUuid: { [uuid: string]: number } = {}
  const indexedNodes: { [internalId: number]: Node } = {}

  const nextInternalId = (uuid: string): number => {
    const internalId = (lastInternalId += 1)
    uuidByInternalId[internalId] = uuid
    internalIdByUuid[uuid] = internalId
    return internalId
  }

  for (const node of nodes) {
    const { uuid, parentUuid } = node
    if (!uuid) {
      continue
    }
    const internalId = nextInternalId(uuid)
    node.iId = internalId
    if (parentUuid) {
      const newParentId = internalIdByUuid[parentUuid]
      if (!newParentId) {
        throw new Error('Invalid nodes hierarchy; descendant node found before parent node: ' + JSON.stringify(node))
      }
      node.pIId = newParentId
      delete node['parentUuid']

      const parentNode = indexedNodes[newParentId]
      const metaHierarchy = [...Nodes.getHierarchy(parentNode), newParentId]
      Objects.assocPath({ obj: node, path: metaHierarchyPath, value: metaHierarchy, sideEffect: true })
    } else {
      Objects.dissocPath({ obj: node, path: metaHierarchyPath, sideEffect: true })
    }
    indexedNodes[internalId] = node
    delete node['uuid']
  }

  record.lastInternalId = lastInternalId

  return record
}

export const RecordInitializer = {
  initInternalIds,
}
