import { Record, RecordNodesIndex } from '../record'

export const getNodeRootUuid = (record: Record): string | undefined => record._nodesIndex?.nodeRootUuid

export const getNodeUuidsByDef =
  (nodeDefUuid: string) =>
  (index: RecordNodesIndex): string[] =>
    Object.keys(index.nodesByDef?.[nodeDefUuid] || {})

export const getNodeUuidsByParentAndChildDef =
  (params: { parentNodeUuid: string; childDefUuid: string }) =>
  (index: RecordNodesIndex): string[] => {
    const { parentNodeUuid, childDefUuid } = params
    return Object.keys(index.nodesByParentAndChildDef?.[parentNodeUuid]?.[childDefUuid] || {})
  }

export const getNodeUuidsByParent =
  (parentNodeUuid: string) =>
  (index: RecordNodesIndex): string[] => {
    const nodesPresenceByChildDefUuid = index.nodesByParentAndChildDef?.[parentNodeUuid] || {}
    return Object.values(nodesPresenceByChildDefUuid).flatMap((nodesPresence) => Object.keys(nodesPresence))
  }

export const getNodeCodeDependentUuids =
  (nodeUuid: string) =>
  (index: RecordNodesIndex): string[] =>
    Object.keys(index.nodeCodeDependents?.[nodeUuid] || {})
