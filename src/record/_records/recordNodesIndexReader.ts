import { RecordNodesIndex } from '../record'

const objectKeysToNumbers = (obj: object): number[] => Object.keys(obj).map(Number)

const getNodeRootInternalId = (index: RecordNodesIndex): number | undefined => index.nodeRootId

const getNodeInternalIdsByDef =
  (nodeDefUuid: string) =>
  (index: RecordNodesIndex): number[] =>
    objectKeysToNumbers(index.nodesByDef?.[nodeDefUuid] ?? {})

const getNodeInternalIdsByParentAndChildDef =
  (params: { parentNodeInternalId: number; childDefUuid: string }) =>
  (index: RecordNodesIndex): number[] => {
    const { parentNodeInternalId, childDefUuid } = params
    return objectKeysToNumbers(index.nodesByParentAndChildDef?.[parentNodeInternalId]?.[childDefUuid] ?? {})
  }

const getNodeInternalIdsByParent =
  (parentNodeInternalId: number) =>
  (index: RecordNodesIndex): number[] => {
    const nodesPresenceByChildDefUuid = index.nodesByParentAndChildDef?.[parentNodeInternalId] ?? {}
    return Object.values(nodesPresenceByChildDefUuid).flatMap((nodesPresence) => objectKeysToNumbers(nodesPresence))
  }

const getNodeCodeDependentInternalIds =
  (nodeInternalId: number) =>
  (index: RecordNodesIndex): number[] =>
    objectKeysToNumbers(index.nodeCodeDependents?.[nodeInternalId] ?? {})

export const RecordNodesIndexReader = {
  getNodeRootInternalId,
  getNodeInternalIdsByDef,
  getNodeInternalIdsByParentAndChildDef,
  getNodeInternalIdsByParent,
  getNodeCodeDependentInternalIds,
}
