import { Node, Nodes } from '../../node'
import { Objects } from '../../utils'
import { Record, RecordNodesIndex } from '../record'

const keys = {
  nodeRootUuid: 'nodeRootUuid',
  nodesByParentAndChildDef: 'nodesByParentAndChildDef',
  nodesByDef: 'nodesByDef',
  nodeCodeDependents: 'nodeCodeDependents',
}

const _addNodeToCodeDependents =
  (node: Node) =>
  (index: RecordNodesIndex): RecordNodesIndex =>
    Nodes.getHierarchyCode(node).reduce(
      (indexAcc, ancestorCodeAttributeUuid) =>
        Objects.assocPath({
          obj: indexAcc,
          path: [keys.nodeCodeDependents, ancestorCodeAttributeUuid, node.uuid],
          value: true,
        }),
      index
    )

const _addNodeToIndex =
  (node: Node) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    const { uuid: nodeUuid, nodeDefUuid } = node

    let indexUpdated = { ...index }

    const parentUuid = node.parentUuid
    if (parentUuid) {
      // nodes by parent and child def uuid
      indexUpdated = Objects.assocPath({
        obj: indexUpdated,
        path: [keys.nodesByParentAndChildDef, parentUuid, nodeDefUuid, nodeUuid],
        value: true,
      })
    } else {
      // root entity index
      indexUpdated = { ...indexUpdated, nodeRootUuid: nodeUuid }
    }

    // nodes by def uuid
    indexUpdated = Objects.assocPath({ obj: indexUpdated, path: [keys.nodesByDef, nodeDefUuid, nodeUuid], value: true })

    // code dependents
    indexUpdated = _addNodeToCodeDependents(node)(indexUpdated)

    return indexUpdated
  }

export const addNodes =
  (nodes: { [key: string]: Node }) =>
  (record: Record): Record => {
    const index = record._nodesIndex || {}
    const indexUpdated = Object.values(nodes).reduce(
      (indexAcc: RecordNodesIndex, node: Node) => _addNodeToIndex(node)(indexAcc),
      index
    )
    return { ...record, _nodesIndex: indexUpdated }
  }

export const addNode =
  (node: Node) =>
  (record: Record): Record =>
    addNodes({ [node.uuid]: node })(record)

const _removeNodeFromCodeDependentsIndex =
  (node: Node) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    let indexUpdated = Nodes.getHierarchyCode(node).reduce(
      (indexAcc, ancestorCodeAttributeUuid) =>
        Objects.dissocPath({ obj: indexAcc, path: [keys.nodeCodeDependents, ancestorCodeAttributeUuid, node.uuid] }),
      index
    )
    indexUpdated = Objects.dissocPath({ obj: indexUpdated, path: [keys.nodeCodeDependents, node.uuid] })
    return indexUpdated
  }

export const removeNode =
  (node: Node) =>
  (record: Record): Record => {
    const { uuid: nodeUuid, parentUuid, nodeDefUuid } = node

    const index = record._nodesIndex || {}
    let indexUpdated = { ...index }

    if (parentUuid) {
      // dissoc from nodes by parent and child def
      indexUpdated = Objects.dissocPath({
        obj: indexUpdated,
        path: [keys.nodesByParentAndChildDef, parentUuid, nodeDefUuid, nodeUuid],
      })
    } else {
      // dissoc root entity
      indexUpdated = Objects.dissocPath({ obj: indexUpdated, path: [keys.nodeRootUuid] })
    }
    // dissoc from nodes by def uuid
    indexUpdated = Objects.dissocPath({ obj: indexUpdated, path: [keys.nodesByDef, nodeDefUuid, nodeUuid] })

    indexUpdated = _removeNodeFromCodeDependentsIndex(node)(indexUpdated)

    return { ...record, _nodesIndex: indexUpdated }
  }
