import { NodeFactory, Nodes, NodesMap } from '../node'
import { NodeDef, NodeDefCode, NodeDefs, NodeDefType } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { Objects } from '../utils'
import type { ArenaRecord, ArenaRecordNode } from './record'
import { RecordUpdateResult } from './recordNodesUpdater'
import { Records } from './records'

const metaHierarchyPath = ['meta', 'h']

interface NodeOld extends ArenaRecordNode {
  uuid?: string
  parentUuid?: string
}

const initInternalIds = (params: { record: ArenaRecord; nodes: NodeOld[] }) => {
  const { record, nodes } = params

  let lastInternalId = 0
  const uuidByInternalId: { [internalId: number]: string } = {}
  const internalIdByUuid: { [uuid: string]: number } = {}
  const indexedNodes: NodesMap = {}

  const nextInternalId = (uuid: string): number => {
    const internalId = (lastInternalId += 1)
    uuidByInternalId[internalId] = uuid
    internalIdByUuid[uuid] = internalId
    return internalId
  }

  for (const node of nodes) {
    const { uuid, parentUuid } = node
    if (!uuid) {
      continue
    }
    const internalId = nextInternalId(uuid)
    node.iId = internalId
    if (parentUuid) {
      const newParentId = internalIdByUuid[parentUuid]
      if (!newParentId) {
        throw new Error('Invalid nodes hierarchy; descendant node found before parent node: ' + JSON.stringify(node))
      }
      node.pIId = newParentId
      delete node['parentUuid']

      const parentNode = indexedNodes[newParentId]
      const metaHierarchy = [...Nodes.getHierarchy(parentNode), newParentId]
      Objects.assocPath({ obj: node, path: metaHierarchyPath, value: metaHierarchy, sideEffect: true })
    } else {
      Objects.dissocPath({ obj: node, path: metaHierarchyPath, sideEffect: true })
    }
    indexedNodes[internalId] = node
    delete node['uuid']
  }

  record.lastInternalId = lastInternalId

  // Rebuild record.nodes to be keyed by internal IDs instead of the old UUIDs
  const newNodesMap: NodesMap = {}
  for (const node of nodes) {
    newNodesMap[node.iId] = node
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
  fixRecord,
  insertMissingSingleNodes,
}
