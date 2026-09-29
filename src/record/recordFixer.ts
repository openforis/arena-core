import { NodeFactory, Nodes, NodesMap } from '../node'
import { NodeDef, NodeDefCode, NodeDefs, NodeDefType } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { Objects } from '../utils'
import type { ArenaRecord, ArenaRecordNode } from './record'
import { RecordUpdateResult } from './recordNodesUpdater'
import { Records } from './records'

interface NodeOldMeta {
  h?: string[]
  hCode?: string[]
  [key: string]: any
}

interface NodeOld extends Omit<ArenaRecordNode, 'meta'> {
  uuid?: string
  parentUuid?: string
  meta?: NodeOldMeta
}

/**
 * True if the record's nodes are still linked by uuid/parentUuid (the shape produced by
 * arena-mobile versions built before the node internal-id migration), rather than by iId/pIId.
 * Only the first node is checked: a record is either fully in the legacy shape or fully in the
 * current one, since both shapes are always written by a single client version in one pass.
 */
const isLegacyNodeFormat = (record: ArenaRecord): boolean => {
  const [firstNode] = Object.values(record.nodes ?? {}) as NodeOld[]
  return Boolean(firstNode) && !firstNode.iId && Boolean(firstNode.uuid)
}

const toInternalIds = (uuids: string[] | undefined, internalIdByUuid: { [uuid: string]: number }): number[] =>
  (uuids ?? []).map((uuid) => internalIdByUuid[uuid]).filter((internalId) => internalId !== undefined)

// builds a new node object instead of deleting the legacy props: "delete" would switch it to the (bigger) V8 dictionary mode
const toInternalIdNode = (params: { node: NodeOld; internalIdByUuid: { [uuid: string]: number } }): ArenaRecordNode => {
  const { node, internalIdByUuid } = params
  const { uuid, parentUuid, meta, ...nodeProps } = node
  const nodeUpdated: ArenaRecordNode = { ...nodeProps, iId: internalIdByUuid[uuid!] }
  if (parentUuid) {
    nodeUpdated.pIId = internalIdByUuid[parentUuid]
  }
  if (meta) {
    // legacy meta.h contains ancestor uuids: hierarchy is now derived from pIId (see Records.getNodeHierarchy)
    const { h: _h, hCode: hCodeUuids, ...metaProps } = meta as NodeOldMeta
    nodeUpdated.meta = hCodeUuids ? { ...metaProps, hCode: toInternalIds(hCodeUuids, internalIdByUuid) } : metaProps
  }
  return nodeUpdated
}

const initInternalIds = (params: { record: ArenaRecord; nodes: NodeOld[] }) => {
  const { record, nodes: nodesParam } = params

  // a node's parent must already have an internal id assigned before the node itself is
  // processed, so shallower nodes (closer to the root) need to come first, regardless of the
  // order they were passed in
  const nodes = nodesParam
    .filter((node) => !!node.uuid)
    .sort((nodeA, nodeB) => (nodeA.meta?.h?.length ?? 0) - (nodeB.meta?.h?.length ?? 0))

  let lastInternalId = 0
  const internalIdByUuid: { [uuid: string]: number } = {}

  for (const node of nodes) {
    const { uuid, parentUuid } = node
    if (parentUuid && !internalIdByUuid[parentUuid]) {
      throw new Error('Invalid nodes hierarchy; descendant node found before parent node: ' + JSON.stringify(node))
    }
    lastInternalId += 1
    internalIdByUuid[uuid!] = lastInternalId
  }
  record.lastNodeInternalId = lastInternalId

  // Rebuild record.nodes to be keyed by internal IDs instead of the old UUIDs;
  // done after assigning all the internal ids: meta.hCode can reference nodes at the same depth
  const newNodesMap: NodesMap = {}
  for (const node of nodes) {
    const nodeUpdated = toInternalIdNode({ node, internalIdByUuid })
    newNodesMap[nodeUpdated.iId] = nodeUpdated
  }
  record.nodes = newNodesMap

  return record
}

const fixCodeAttribute = (params: {
  survey: Survey
  nodeDef: NodeDefCode
  record: ArenaRecord
  node: ArenaRecordNode
  sideEffect: boolean
}): ArenaRecordNode => {
  const { survey, nodeDef, record, node, sideEffect } = params
  if (!NodeDefs.getParentCodeDefUuid(nodeDef) || Objects.isNotEmpty(Nodes.getHierarchyCode(node))) {
    // nodeDef is not a code attribute or meta.hCode already populated: do nothing
    return node
  }
  const parentNode = Records.getParent(node)(record)
  if (!parentNode) {
    // missing parent node; node parentUuid could be invalid
    return node
  }
  // populate meta.hCode with ancestor code attribute node internal ids
  const hCode: number[] = []
  let currentCodeDef: NodeDefCode = nodeDef
  let currentParentCodeAttribute = Records.getParentCodeAttribute({ parentNode, nodeDef: currentCodeDef })(record)
  while (currentParentCodeAttribute) {
    hCode.unshift(currentParentCodeAttribute.iId)
    currentCodeDef = Surveys.getNodeDefByUuid({ survey, uuid: currentParentCodeAttribute.nodeDefUuid }) as NodeDefCode
    currentParentCodeAttribute = Records.getParentCodeAttribute({ parentNode, nodeDef: currentCodeDef })(record)
  }
  const nodeUpdated = sideEffect ? node : { ...node }
  nodeUpdated.meta = { ...nodeUpdated.meta, hCode }
  return nodeUpdated
}

const insertMissingSingleNode = (params: {
  survey: Survey
  nodeDef: NodeDef<any>
  record: ArenaRecord
  parentNode: ArenaRecordNode
  sideEffect: boolean
}): RecordUpdateResult | null => {
  const { survey, nodeDef, record, parentNode, sideEffect } = params
  if (!NodeDefs.isSingle(nodeDef)) {
    // multiple node: don't insert it
    return null
  }
  const nodeDefUuid = nodeDef.uuid
  const children = Records.getChildren(parentNode, nodeDef.uuid)(record)
  if (!Objects.isEmpty(children)) {
    // single node already inserted
    return null
  }
  // insert missing single node
  let node = NodeFactory.createInstance({ record, nodeDefUuid, parentNode })

  if (nodeDef.type === NodeDefType.code) {
    node = fixCodeAttribute({ survey, nodeDef: nodeDef as NodeDefCode, record, node, sideEffect })
  }

  const recordUpdated = Records.addNode(node, { sideEffect })(record)
  return new RecordUpdateResult({ record: recordUpdated, nodes: { [node.iId]: node } })
}

const insertMissingSingleNodes = (params: {
  survey: Survey
  record: ArenaRecord
  sideEffect: boolean
}): RecordUpdateResult => {
  const { survey, record, sideEffect } = params
  const updateResult = new RecordUpdateResult({ record })
  Surveys.visitNodeDefs({
    survey,
    visitor: (nodeDef) => {
      const parentDefUuid = nodeDef.parentUuid
      if (parentDefUuid) {
        const parentNodes = Records.getNodesByDefUuid(parentDefUuid)(updateResult.record)
        for (const parentNode of parentNodes) {
          const partialUpdateResult = insertMissingSingleNode({
            survey,
            nodeDef,
            record: updateResult.record,
            parentNode,
            sideEffect,
          })
          if (partialUpdateResult) {
            updateResult.merge(partialUpdateResult)
          }
        }
      }
    },
  })
  return updateResult
}

const deleteNodesByDefUuid = (params: { record: ArenaRecord; nodeDefUuid: string; sideEffect: boolean }) => {
  const { record, nodeDefUuid, sideEffect } = params
  const updateResult = new RecordUpdateResult({ record })

  const recordUpdateOptions = { sideEffect }

  const nodesToDelete = Records.getNodesByDefUuid(nodeDefUuid)(updateResult.record)
  for (const nodeToDelete of nodesToDelete) {
    // cleanup child applicability
    const parentNode = Records.getParent(nodeToDelete)(updateResult.record)
    if (parentNode && !Nodes.isChildApplicable(parentNode, nodeDefUuid)) {
      const parentNodeUpdated = Nodes.dissocChildApplicability(parentNode, nodeDefUuid)
      const recordWithParentNodeUpdated = Records.addNode(parentNodeUpdated, recordUpdateOptions)(updateResult.record)
      updateResult.merge(new RecordUpdateResult({ record: recordWithParentNodeUpdated }))
    }
  }
  const nodeInternalIdsToDelete = nodesToDelete.map((node) => node.iId)
  const nodesDeleteUpdateResult = Records.deleteNodes(nodeInternalIdsToDelete, recordUpdateOptions)(updateResult.record)

  updateResult.merge(nodesDeleteUpdateResult)

  return updateResult
}

/**
 * Fix a record by:
 * - inserting missing single nodes
 * - deleting nodes with non existing node defs
 * - removing status flags (created, deleted, updated) from all nodes
 */
const fixRecord = (params: { survey: Survey; record: ArenaRecord; sideEffect?: boolean }): RecordUpdateResult => {
  const { survey, record, sideEffect = false } = params
  const result = new RecordUpdateResult({ record })

  for (const node of Records.getNodesArray(record)) {
    const { nodeDefUuid } = node
    const nodeDef = Surveys.findNodeDefByUuid({ survey, uuid: nodeDefUuid })
    if (nodeDef) {
      // remove status flags
      let nodeUpdated = Nodes.removeStatusFlags({ node, sideEffect })

      if (nodeDef.type === NodeDefType.code) {
        nodeUpdated = fixCodeAttribute({
          survey,
          nodeDef: nodeDef as NodeDefCode,
          record: result.record,
          node: nodeUpdated,
          sideEffect,
        })
      }
      result.addNode(nodeUpdated, { sideEffect })
    } else {
      const nodesDeletedUpdatedResult = deleteNodesByDefUuid({ record: result.record, nodeDefUuid, sideEffect })
      result.merge(nodesDeletedUpdatedResult)
    }
  }
  const missingNodesUpdateResult = insertMissingSingleNodes({ survey, record: result.record, sideEffect })
  result.merge(missingNodesUpdateResult)
  return result
}

export const RecordFixer = {
  initInternalIds,
  isLegacyNodeFormat,
  fixRecord,
  insertMissingSingleNodes,
}
