import { Node, Nodes } from '../../node'
import { Objects } from '../../utils'
import { Record, RecordNodesIndex } from '../record'

const keys = {
  nodeRootUuid: 'nodeRootUuid',
  nodesByParentAndChildDef: 'nodesByParentAndChildDef',
  nodesByDef: 'nodesByDef',
  nodeCodeDependents: 'nodeCodeDependents',
}

const _getOrShortenUuid = (uuid: string, sideEffect: boolean) => (index: RecordNodesIndex) => {
  let shorten = index.shortenUuidByUuid?.[uuid]
  if (shorten) return { index, shorten }

  shorten = index.lastShortenUuid ? String(Number(index.lastShortenUuid) + 1) : '1'
  const shortenUuidByUuid = index.shortenUuidByUuid ?? {}
  const uuidByShortenUuid = index.uuidByShortenUuid ?? {}
  if (sideEffect) {
    shortenUuidByUuid[uuid] = shorten
    index.shortenUuidByUuid = shortenUuidByUuid
    index.uuidByShortenUuid = uuidByShortenUuid
    index.lastShortenUuid = shorten
    return { index, shorten }
  } else {
    const indexUpdated = {
      ...index,
      shortenUuidByUuid: { ...shortenUuidByUuid, [uuid]: shorten },
      uuidByShortenUuid: { ...uuidByShortenUuid, [shorten]: uuid },
      lastShortenUuid: shorten
    }
    return { index: indexUpdated, shorten }
  }
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

      const { shorten: nodeUuidShorten, index: indexUpdatedNodeUuid } = _getOrShortenUuid(nodeUuid, sideEffect)(indexUpdated)
      indexUpdated = indexUpdatedNodeUuid

      const { shorten: nodeDefUuidShorten, index: indexUpdatedNodeDefUuid } = _getOrShortenUuid(nodeDefUuid, sideEffect)(indexUpdated)
      indexUpdated = indexUpdatedNodeDefUuid

      const parentUuid = node.parentUuid
      if (parentUuid) {
        const { shorten: parentUuidShorten, index: indexUpdatedParentUuid } = _getOrShortenUuid(parentUuid, sideEffect)(indexUpdated)
        indexUpdated = indexUpdatedParentUuid

        // nodes by parent and child def uuid
        indexUpdated = Objects.assocPath({
          obj: indexUpdated,
          path: [keys.nodesByParentAndChildDef, parentUuidShorten, nodeDefUuidShorten, nodeUuidShorten],
          value: true,
          sideEffect,
        })
      } else {
        // root entity index
        indexUpdated.nodeRootUuid = nodeUuidShorten
      }

      // nodes by def uuid
      indexUpdated = Objects.assocPath({
        obj: indexUpdated,
        path: [keys.nodesByDef, nodeDefUuidShorten, nodeUuidShorten],
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
