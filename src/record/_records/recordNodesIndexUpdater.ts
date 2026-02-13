import { Node, Nodes } from '../../node'
import { Objects } from '../../utils'
import { Record, RecordNodesIndex } from '../record'

const keys = {
  nodeRootId: 'nodeRootId',
  nodesByParentAndChildDef: 'nodesByParentAndChildDef',
  nodesByDef: 'nodesByDef',
  nodeCodeDependents: 'nodeCodeDependents',
}

const sortNodesByHierarchyAndIdOrCreationDate = (nodeA: Node, nodeB: Node): number => {
  // root node first
  if (!nodeA.pIId) return -1
  if (!nodeB.pIId) return 1
  // then by hierarchy depth (parents before descendants)
  const hierarchyDepthA = Nodes.getHierarchy(nodeA).length
  const hierarchyDepthB = Nodes.getHierarchy(nodeB).length
  const depthDiff = hierarchyDepthA - hierarchyDepthB
  if (depthDiff !== 0) return depthDiff
  // then by id or creation date
  if (nodeA.id && nodeB.id) return nodeA.id - nodeB.id
  if (nodeA.dateCreated && nodeB.dateCreated) return nodeA.dateCreated.localeCompare(nodeB.dateCreated)
  return 0
}

const _addNodeToCodeDependents =
  (node: Node, sideEffect: boolean) =>
  (index: RecordNodesIndex): RecordNodesIndex =>
    Nodes.getHierarchyCode(node).reduce(
      (indexAcc, ancestorCodeAttributeInternalId: number) =>
        Objects.assocPath({
          obj: indexAcc,
          path: [keys.nodeCodeDependents, String(ancestorCodeAttributeInternalId), String(node.iId)],
          value: true,
          sideEffect,
        }),
      index
    )

const _addNodeToIndex =
  (node: Node, sideEffect = false) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    const { iId: nodeIId, nodeDefUuid, pIId } = node

    let indexUpdated = sideEffect ? index : { ...index }

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
  (nodes: { [internalId: number]: Node }, sideEffect = false, sortNodes = false) =>
  (nodesIndex: RecordNodesIndex): RecordNodesIndex => {
    let indexUpdated = sideEffect ? nodesIndex : { ...nodesIndex }
    const nodesArray = Object.values(nodes)
    if (sortNodes) {
      nodesArray.sort(sortNodesByHierarchyAndIdOrCreationDate)
    }
    for (const node of nodesArray) {
      indexUpdated = _addNodeToIndex(node, sideEffect)(indexUpdated)
    }
    return indexUpdated
  }

const addNode =
  (node: Node) =>
  (index: RecordNodesIndex): RecordNodesIndex =>
    addNodes({ [node.iId]: node })(index)

const initializeIndex = (record: Record): RecordNodesIndex => addNodes(record.nodes ?? {}, true, true)({})

const _removeNodeFromCodeDependentsIndex =
  (node: Node, sideEffect = false) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    const { iId: nodeInternalId } = node

    let indexUpdated = Nodes.getHierarchyCode(node).reduce(
      (indexAcc, ancestorCodeAttributeId: number) =>
        Objects.dissocPath({
          obj: indexAcc,
          path: [keys.nodeCodeDependents, String(ancestorCodeAttributeId), String(nodeInternalId)],
          sideEffect,
        }),
      index
    )
    indexUpdated = Objects.dissocPath({
      obj: indexUpdated,
      path: [keys.nodeCodeDependents, String(nodeInternalId)],
      sideEffect,
    })
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
