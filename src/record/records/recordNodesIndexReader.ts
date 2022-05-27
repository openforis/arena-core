import { Record } from '../record'

export const getNodeRootUuid = (record: Record): string | undefined => record._nodesIndex?.nodeRootUuid

export const getNodeUuidsByDef =
  (nodeDefUuid: string) =>
  (record: Record): string[] =>
    Object.keys(record._nodesIndex?.nodesByDef?.[nodeDefUuid] || {})

export const getNodeUuidsByParentAndChildDef =
  (params: { parentNodeUuid: string; childDefUuid: string }) =>
  (record: Record): string[] => {
    const { parentNodeUuid, childDefUuid } = params
    return Object.keys(record._nodesIndex?.nodesByParentAndChildDef?.[parentNodeUuid]?.[childDefUuid] || {})
  }

export const getNodeUuidsByParent =
  (parentNodeUuid: string) =>
  (record: Record): string[] => {
    const nodesPresenceByChildDefUuid = record._nodesIndex?.nodesByParentAndChildDef?.[parentNodeUuid] || {}
    return Object.values(nodesPresenceByChildDefUuid).flatMap((nodesPresence) => Object.keys(nodesPresence))
  }

export const getNodeCodeDependentUuids =
  (nodeUuid: string) =>
  (record: Record): string[] =>
    Object.keys(record._nodesIndex?.nodeCodeDependents?.[nodeUuid] || {})
