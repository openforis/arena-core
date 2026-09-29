import { RecordNodesIndex } from '../record'

// internal ID lists are returned as they are stored in the index: they must not be modified by the caller
const emptyList: readonly number[] = []

const getNodeRootInternalId = (index: RecordNodesIndex): number | undefined => index.nodeRootIId

const getNodeInternalIdsByDef =
  (nodeDefUuid: string) =>
  (index: RecordNodesIndex): readonly number[] =>
    index.nodesByDef?.[nodeDefUuid] ?? emptyList

const getNodeInternalIdsByParentAndChildDef =
  (params: { parentNodeInternalId: number; childDefUuid: string }) =>
  (index: RecordNodesIndex): readonly number[] => {
    const { parentNodeInternalId, childDefUuid } = params
    return index.nodesByParentAndChildDef?.[parentNodeInternalId]?.[childDefUuid] ?? emptyList
  }

const getNodeInternalIdsByParent =
  (parentNodeInternalId: number) =>
  (index: RecordNodesIndex): number[] => {
    const internalIdsByChildDefUuid = index.nodesByParentAndChildDef?.[parentNodeInternalId] ?? {}
    return Object.values(internalIdsByChildDefUuid).flat()
  }

const getNodeCodeDependentInternalIds =
  (nodeInternalId: number) =>
  (index: RecordNodesIndex): readonly number[] =>
    index.nodeCodeDependents?.[nodeInternalId] ?? emptyList

export const RecordNodesIndexReader = {
  getNodeRootInternalId,
  getNodeInternalIdsByDef,
  getNodeInternalIdsByParentAndChildDef,
  getNodeInternalIdsByParent,
  getNodeCodeDependentInternalIds,
}
