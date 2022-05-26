import { Node, Nodes } from '../../node'
import { Objects } from '../../utils'
import { Record, RecordNodesIndex } from '../record'

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
    Object.keys(Objects.path(['_nodesIndex', 'nodeCodeDependents', nodeUuid])(record) || {})

const _addNodeToCodeDependents =
  (node: Node) =>
  (index: RecordNodesIndex): RecordNodesIndex =>
    Nodes.getHierarchyCode(node).reduce(
      (indexAcc, ancestorCodeAttributeUuid) =>
        Objects.assocPath({
          obj: indexAcc,
          path: ['nodeCodeDependents', ancestorCodeAttributeUuid, node.uuid],
          value: true,
        }),
      index
    )

const _addNode =
  (node: Node) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    const nodeUuid = node.uuid
    const nodeDefUuid = node.nodeDefUuid

    let indexUpdated = { ...index }

    const parentUuid = node.parentUuid
    if (parentUuid) {
      // nodes by parent and child def uuid
      indexUpdated = Objects.assocPath({
        obj: indexUpdated,
        path: ['nodesByParentAndChildDef', parentUuid, nodeDefUuid, nodeUuid],
        value: true,
      })
    } else {
      // root entity index
      indexUpdated = { ...indexUpdated, nodeRootUuid: nodeUuid }
    }

    // nodes by def uuid
    indexUpdated = Objects.assocPath({ obj: indexUpdated, path: ['nodesByDef', nodeDefUuid, nodeUuid], value: true })

    // code dependents
    indexUpdated = _addNodeToCodeDependents(node)(indexUpdated)

    return indexUpdated
  }

export const addNodes = (nodes: { [key: string]: Node }) => (record: Record) => {
  const indexUpdated = Object.values(nodes).reduce(
    (indexAcc: RecordNodesIndex, node: Node) => _addNode(node)(indexAcc),
    record._nodesIndex || {}
  )
  return { ...record, _nodesIndex: indexUpdated }
}
