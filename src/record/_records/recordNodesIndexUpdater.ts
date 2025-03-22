import { Node, Nodes } from '../../node'
import { Objects } from '../../utils'
import { InternalIdCacheManager } from '../internalIdCacheManager'
import { Record, RecordNodesIndex } from '../record'

const keys = {
  nodeRootUuid: 'nodeRootUuid',
  nodesByParentAndChildDef: 'nodesByParentAndChildDef',
  nodesByDef: 'nodesByDef',
  nodeCodeDependents: 'nodeCodeDependents',
}

const _generateInternalId = (uuid: string) => (index: RecordNodesIndex, sideEffect: boolean) => {
  const idCache = index.internalIdCache ?? {}
  const { id, cache: idCacheUpdated } = InternalIdCacheManager.getOrCreateId(uuid, sideEffect)(idCache)
  const indexUpdated = Objects.assoc({ obj: index, prop: 'internalIdCache', value: idCacheUpdated, sideEffect })
  return { index: indexUpdated, id: String(id) }
}

const _addNodeToCodeDependents =
  (node: Node, sideEffect: boolean) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    let indexUpdated = sideEffect ? index : { ...index }

    const generateInternalId = (uuid: string): string => {
      const { index: indexUpdatedNew, id } = _generateInternalId(uuid)(indexUpdated, sideEffect)
      indexUpdated = indexUpdatedNew
      return id
    }
    const nodeInternalId = generateInternalId(node.uuid)

    Nodes.getHierarchyCode(node).forEach((ancestorCodeAttributeUuid) => {
      const ancestorCodeInternalUuid = generateInternalId(ancestorCodeAttributeUuid)
      indexUpdated = Objects.assocPath({
        obj: indexUpdated,
        path: [keys.nodeCodeDependents, ancestorCodeInternalUuid, nodeInternalId],
        value: true,
        sideEffect,
      })
    })

    return indexUpdated
  }

const _addNodeToIndex =
  (node: Node, sideEffect = false) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    const { uuid: nodeUuid, nodeDefUuid } = node

    let indexUpdated = sideEffect ? index : { ...index }

    const generateInternalId = (uuid: string): string => {
      const { index: indexUpdatedNew, id } = _generateInternalId(uuid)(indexUpdated, sideEffect)
      indexUpdated = indexUpdatedNew
      return id
    }

    const nodeInternalId = generateInternalId(nodeUuid)
    const nodeDefInternalId = generateInternalId(nodeDefUuid)
    const { parentUuid } = node
    if (parentUuid) {
      const parentInternalId = generateInternalId(parentUuid)
      // nodes by parent and child def uuid
      indexUpdated = Objects.assocPath({
        obj: indexUpdated,
        path: [keys.nodesByParentAndChildDef, parentInternalId, nodeDefInternalId, nodeInternalId],
        value: true,
        sideEffect,
      })
    } else {
      // root entity index
      indexUpdated.nodeRootUuid = nodeInternalId
    }

    // nodes by def uuid
    indexUpdated = Objects.assocPath({
      obj: indexUpdated,
      path: [keys.nodesByDef, nodeDefInternalId, nodeInternalId],
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

const initializeIndex = (record: Record): RecordNodesIndex => addNodes(record.nodes ?? {}, true)({})

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
