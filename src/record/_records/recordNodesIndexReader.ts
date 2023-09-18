import { RecordNodesIndex } from '../record'

const getNodeRootUuid = (index: RecordNodesIndex): string | undefined => index.nodeRootUuid

const getNodeUuidsByDef =
  (nodeDefUuid: string) =>
  (index: RecordNodesIndex): string[] =>
    Object.keys(index.nodesByDef?.[nodeDefUuid] ?? {})

const getNodeUuidsByParentAndChildDef =
  (params: { parentNodeUuid: string; childDefUuid: string }) =>
  (index: RecordNodesIndex): string[] => {
    const { parentNodeUuid, childDefUuid } = params
    return Object.keys(index.nodesByParentAndChildDef?.[parentNodeUuid]?.[childDefUuid] ?? {})
  }

const getNodeUuidsByParent =
  (parentNodeUuid: string) =>
  (index: RecordNodesIndex): string[] => {
    const nodesPresenceByChildDefUuid = index.nodesByParentAndChildDef?.[parentNodeUuid] ?? {}
    return Object.values(nodesPresenceByChildDefUuid).flatMap((nodesPresence) => Object.keys(nodesPresence))
  }

const getNodeCodeDependentUuids =
  (nodeUuid: string) =>
  (index: RecordNodesIndex): string[] =>
    Object.keys(index.nodeCodeDependents?.[nodeUuid] ?? {})

export const RecordNodesIndexReader = {
  getNodeRootUuid,
  getNodeUuidsByDef,
  getNodeUuidsByParentAndChildDef,
  getNodeUuidsByParent,
  getNodeCodeDependentUuids,
}
