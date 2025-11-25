import { Node, Nodes } from '../../node'
import { Objects } from '../../utils'
import { Record, RecordNodesIndex } from '../record'

const keys = {
  nodeRootUuid: 'nodeRootUuid',
  nodesByParentAndChildDef: 'nodesByParentAndChildDef',
  nodesByDef: 'nodesByDef',
  nodeCodeDependents: 'nodeCodeDependents',
}

const sortNodesByIdOrCreationDate = (nodeA: Node, nodeB: Node): number => {
  if (!nodeA.parentUuid) return -1
  if (!nodeB.parentUuid) return 1
  const hierarchyDepthA = Nodes.getHierarchy(nodeA).length
  const hierarchyDepthB = Nodes.getHierarchy(nodeB).length
  const depthDiff = hierarchyDepthA - hierarchyDepthB
  if (depthDiff !== 0) return depthDiff
  if (nodeA.id && nodeB.id) return nodeA.id - nodeB.id
  if (nodeA.dateCreated && nodeB.dateCreated) return nodeA.dateCreated.localeCompare(nodeB.dateCreated)
  return 0
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
  (nodes: { [key: string]: Node }, sideEffect = false, sortNodes = false) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    let indexUpdated = sideEffect ? index : { ...index }
    const nodesArray = Object.values(nodes)
    if (sortNodes) {
      nodesArray.sort(sortNodesByIdOrCreationDate)
    }
    for (const node of nodesArray) {
      indexUpdated = _addNodeToIndex(node, sideEffect)(indexUpdated)
    }
    return indexUpdated
  }

const addNode =
  (node: Node) =>
  (index: RecordNodesIndex): RecordNodesIndex =>
    addNodes({ [node.uuid]: node })(index)

const initializeIndex = (record: Record): RecordNodesIndex => addNodes(record.nodes ?? {}, true, true)({})

const _removeNodeFromCodeDependentsIndex =
  (node: Node, sideEffect = false) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    let indexUpdated = Nodes.getHierarchyCode(node).reduce(
      (indexAcc, ancestorCodeAttributeUuid) =>
        Objects.dissocPath({
          obj: indexAcc,
          path: [keys.nodeCodeDependents, ancestorCodeAttributeUuid, node.uuid],
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
    const { uuid: nodeUuid, parentUuid, nodeDefUuid } = node

    let indexUpdated = sideEffect ? index : { ...index }

    if (parentUuid) {
      // dissoc from nodes by parent and child def
      indexUpdated = Objects.dissocPath({
        obj: indexUpdated,
        path: [keys.nodesByParentAndChildDef, parentUuid, nodeDefUuid, nodeUuid],
        sideEffect,
      })
      const nodesByParentAndChildDefPath = [keys.nodesByParentAndChildDef, parentUuid, nodeDefUuid]
      indexUpdated = Objects.dissocPathIfEmpty({ obj: indexUpdated, path: nodesByParentAndChildDefPath, sideEffect })
    } else {
      // dissoc root entity
      indexUpdated = Objects.dissocPath({ obj: indexUpdated, path: [keys.nodeRootUuid], sideEffect })
    }
    // dissoc from nodes by def uuid
    indexUpdated = Objects.dissocPath({ obj: indexUpdated, path: [keys.nodesByDef, nodeDefUuid, nodeUuid], sideEffect })
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
