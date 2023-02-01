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
  (node: Node, sideEffect: boolean) =>
  (index: RecordNodesIndex): RecordNodesIndex =>
    Nodes.getHierarchyCode(node).reduce(
      (indexAcc, ancestorCodeAttributeUuid) =>
        Objects.assocPath({
          obj: indexAcc,
          path: [keys.nodeCodeDependents, ancestorCodeAttributeUuid, node.uuid],
          value: true,
          sideEffect,
        }),
      index
    )

const _addNodeToIndex =
  (node: Node, sideEffect = false) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    const { uuid: nodeUuid, nodeDefUuid } = node

    let indexUpdated = sideEffect ? index : { ...index }

    const parentUuid = node.parentUuid
    if (parentUuid) {
      // nodes by parent and child def uuid
      indexUpdated = Objects.assocPath({
        obj: indexUpdated,
        path: [keys.nodesByParentAndChildDef, parentUuid, nodeDefUuid, nodeUuid],
        value: true,
        sideEffect,
      })
    } else {
      // root entity index
      indexUpdated.nodeRootUuid = nodeUuid
    }

    // nodes by def uuid
    indexUpdated = Objects.assocPath({
      obj: indexUpdated,
      path: [keys.nodesByDef, nodeDefUuid, nodeUuid],
      value: true,
      sideEffect,
    })

    // code dependents
    indexUpdated = _addNodeToCodeDependents(node, sideEffect)(indexUpdated)

    return indexUpdated
  }

const addNodes =
  (nodes: { [key: string]: Node }, sideEffect = false) =>
  (index: RecordNodesIndex): RecordNodesIndex =>
    Object.values(nodes).reduce(
      (indexAcc: RecordNodesIndex, node: Node) => _addNodeToIndex(node, sideEffect)(indexAcc),
      index
    )

const addNode =
  (node: Node) =>
  (index: RecordNodesIndex): RecordNodesIndex =>
    addNodes({ [node.uuid]: node })(index)

const initializeIndex = (record: Record): RecordNodesIndex => addNodes(record.nodes || {}, true)({})

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

const removeNode =
  (node: Node) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    const { uuid: nodeUuid, parentUuid, nodeDefUuid } = node

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

    return indexUpdated
  }

export const RecordNodesIndexUpdater = {
  addNode,
  addNodes,
  initializeIndex,
  removeNode,
}
