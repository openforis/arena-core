import { RecordNodesIndex } from '../record'

const getUuid =
  (internalId: string | undefined) =>
  (index: RecordNodesIndex): string | undefined =>
    internalId ? index.internalIdCache?.uuidById?.[internalId] : internalId

const getUuids =
  (internalIds: string[]) =>
  (index: RecordNodesIndex): string[] =>
    internalIds.map((id) => getUuid(id)(index)!)

const getInternalId =
  (uuid: string) =>
  (index: RecordNodesIndex): string | undefined => {
    const id = index.internalIdCache?.idByUuid?.[uuid]
    return id ? String(id) : undefined
  }

const getNodeRootUuid = (index: RecordNodesIndex): string | undefined => getUuid(index.nodeRootUuid)(index)

const getNodeUuidsByDef =
  (nodeDefUuid: string) =>
  (index: RecordNodesIndex): string[] => {
    const nodeDefInternalId = getInternalId(nodeDefUuid)(index)
    if (!nodeDefInternalId) return []
    const internalIds = Object.keys(index.nodesByDef?.[nodeDefInternalId] ?? {})
    return getUuids(internalIds)(index)
  }

const getNodeUuidsByParentAndChildDef =
  (params: { parentNodeUuid: string; childDefUuid: string }) =>
  (index: RecordNodesIndex): string[] => {
    const { parentNodeUuid, childDefUuid } = params
    const parentNodeInternalId = getInternalId(parentNodeUuid)(index)
    const childDefInternalId = getInternalId(childDefUuid)(index)
    if (!parentNodeInternalId || !childDefInternalId) return []
    const internalIds = Object.keys(index.nodesByParentAndChildDef?.[parentNodeInternalId]?.[childDefInternalId] ?? {})
    return getUuids(internalIds)(index)
  }

const getNodeUuidsByParent =
  (parentNodeUuid: string) =>
  (index: RecordNodesIndex): string[] => {
    const parentNodeInternalId = getInternalId(parentNodeUuid)(index)
    if (!parentNodeInternalId) return []
    const nodesPresenceByChildDefInternalId = index.nodesByParentAndChildDef?.[parentNodeInternalId] ?? {}
    return Object.values(nodesPresenceByChildDefInternalId).flatMap((nodesPresence) =>
      getUuids(Object.keys(nodesPresence))(index)
    )
  }

const getNodeCodeDependentUuids =
  (nodeUuid: string) =>
  (index: RecordNodesIndex): string[] => {
    const nodeInternalId = getInternalId(nodeUuid)(index)
    if (!nodeInternalId) return []
    return getUuids(Object.keys(index.nodeCodeDependents?.[nodeInternalId] ?? {}))(index)
  }

export const RecordNodesIndexReader = {
  getNodeRootUuid,
  getNodeUuidsByDef,
  getNodeUuidsByParentAndChildDef,
  getNodeUuidsByParent,
  getNodeCodeDependentUuids,
}
