import { Node, Nodes } from '../../node'
import { Objects } from '../../utils'
import { Record, RecordNodesIndex } from '../record'

const keys = {
  nodeRootId: 'nodeRootId',
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
          path: [keys.nodeCodeDependents, ancestorCodeAttributeUuid, String(node.iId)],
          value: true,
          sideEffect,
        }),
      index
    )

const _addNodeToIndex =
  (node: Node, sideEffect = false) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    const { iId: nodeIId, nodeDefUuid } = node

    let indexUpdated = sideEffect ? index : { ...index }

    const { pIId } = node
    if (pIId) {
      // nodes by parent and child def uuid
      indexUpdated = Objects.assocPath({
        obj: indexUpdated,
        path: [keys.nodesByParentAndChildDef, String(pIId), nodeDefUuid, String(nodeIId)],
        value: true,
        sideEffect,
      })
    } else {
      // root entity index
      indexUpdated.nodeRootId = nodeIId
    }

    // nodes by def uuid
    indexUpdated = Objects.assocPath({
      obj: indexUpdated,
      path: [keys.nodesByDef, nodeDefUuid, String(nodeIId)],
      value: true,
      sideEffect,
    })

    // code dependents
    indexUpdated = _addNodeToCodeDependents(node, sideEffect)(indexUpdated)

    return indexUpdated
  }

const addNodes =
  (nodes: { [internalId: number]: Node }, sideEffect = false) =>
  (nodesIndex: RecordNodesIndex): RecordNodesIndex => {
    let indexUpdated = nodesIndex
    for (const node of Object.values(nodes)) {
      indexUpdated = _addNodeToIndex(node, sideEffect)(indexUpdated)
    }
    return indexUpdated
  }

const addNode =
  (node: Node) =>
  (index: RecordNodesIndex): RecordNodesIndex =>
    addNodes({ [node.uuid]: node })(index)

const initializeIndex = (record: Record): RecordNodesIndex => addNodes(record.nodes ?? {}, true)({})

const _removeNodeFromCodeDependentsIndex =
  (node: Node, sideEffect = false) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    let indexUpdated = Nodes.getHierarchyCode(node).reduce(
      (indexAcc, ancestorCodeAttributeUuid) =>
        Objects.dissocPath({
          obj: indexAcc,
          path: [keys.nodeCodeDependents, ancestorCodeAttributeUuid, node.iId],
          sideEffect,
        }),
      index
    )
    indexUpdated = Objects.dissocPath({ obj: indexUpdated, path: [keys.nodeCodeDependents, node.uuid], sideEffect })
    return indexUpdated
  }

const removeNode =
  (node: Node, sideEffect = false) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    const { iId: nodeId, pIId, nodeDefUuid } = node

    let indexUpdated = sideEffect ? index : { ...index }

    if (pIId) {
      // dissoc from nodes by parent and child def
      const nodesByParentAndChildDefPath = [keys.nodesByParentAndChildDef, String(pIId), nodeDefUuid]
      indexUpdated = Objects.dissocPath({
        obj: indexUpdated,
        path: [...nodesByParentAndChildDefPath, String(nodeId)],
        sideEffect,
      })
      indexUpdated = Objects.dissocPathIfEmpty({ obj: indexUpdated, path: nodesByParentAndChildDefPath, sideEffect })
    } else {
      // dissoc root entity
      indexUpdated = Objects.dissocPath({ obj: indexUpdated, path: [keys.nodeRootId], sideEffect })
    }
    // dissoc from nodes by def uuid
    indexUpdated = Objects.dissocPath({
      obj: indexUpdated,
      path: [keys.nodesByDef, nodeDefUuid, String(nodeId)],
      sideEffect,
    })
    const nodesByDefPath = [keys.nodesByDef, nodeDefUuid]
    indexUpdated = Objects.dissocPathIfEmpty({ obj: indexUpdated, path: nodesByDefPath, sideEffect })

    indexUpdated = _removeNodeFromCodeDependentsIndex(node, sideEffect)(indexUpdated)

    return indexUpdated
  }

export const RecordNodesIndexUpdater = {
  addNode,
  addNodes,
  initializeIndex,
  removeNode,
}
