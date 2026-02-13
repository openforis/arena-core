import { Node, NodeFactory, Nodes } from '../node'
import { NodeDef, NodeDefs } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { Objects } from '../utils'
import { Record } from './record'
import { RecordUpdateResult } from './recordNodesUpdater'
import { Records } from './records'

const metaHierarchyPath = ['meta', 'h']

interface NodeOld extends Node {
  uuid?: string
  parentUuid?: string
}

const initInternalIds = (params: { record: Record; nodes: NodeOld[] }) => {
  const { record, nodes } = params

  let lastInternalId = 0
  const uuidByInternalId: { [internalId: number]: string } = {}
  const internalIdByUuid: { [uuid: string]: number } = {}
  const indexedNodes: { [internalId: number]: Node } = {}

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

  return record
}

const insertMissingSingleNode = (params: {
  nodeDef: NodeDef<any>
  record: Record
  parentNode: Node
  sideEffect: boolean
}): RecordUpdateResult | null => {
  const { nodeDef, record, parentNode, sideEffect } = params
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
  const node = NodeFactory.createInstance({ record, nodeDefUuid, parentNode })
  const recordUpdated = Records.addNode(node, { sideEffect })(record)
  return new RecordUpdateResult({ record: recordUpdated, nodes: { [node.iId]: node } })
}

const insertMissingSingleNodes = (params: {
  survey: Survey
  record: Record
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

const deleteNodesByDefUuid = (params: { record: Record; nodeDefUuid: string; sideEffect: boolean }) => {
  const { record, nodeDefUuid, sideEffect } = params
  const updateResult = new RecordUpdateResult({ record })

  const nodesToDelete = Records.getNodesByDefUuid(nodeDefUuid)(updateResult.record)
  for (const nodeToDelete of nodesToDelete) {
    // cleanup child applicability
    const parentNode = Records.getParent(nodeToDelete)(updateResult.record)
    if (parentNode && !Nodes.isChildApplicable(parentNode, nodeDefUuid)) {
      const parentNodeUpdated = Nodes.dissocChildApplicability(parentNode, nodeDefUuid)
      const recordWithParentNodeUpdated = Records.addNode(parentNodeUpdated, { sideEffect })(updateResult.record)
      updateResult.merge(new RecordUpdateResult({ record: recordWithParentNodeUpdated }))
    }
  }
  const nodeInternalIdsToDelete = nodesToDelete.map((node) => node.iId)
  const nodesDeleteUpdateResult = Records.deleteNodes(nodeInternalIdsToDelete, { sideEffect })(updateResult.record)

  updateResult.merge(nodesDeleteUpdateResult)

  return updateResult
}

/**
 * Fix a record by:
 * - inserting missing single nodes
 * - deleting nodes with non existing node defs
 * - removing status flags (created, deleted, updated) from all nodes
 */
const fixRecord = (params: { survey: Survey; record: Record; sideEffect?: boolean }): RecordUpdateResult => {
  const { survey, record, sideEffect = false } = params
  const result = new RecordUpdateResult({ record })

  for (const node of Records.getNodesArray(record)) {
    const { nodeDefUuid } = node
    const nodeDef = Surveys.findNodeDefByUuid({ survey, uuid: nodeDefUuid })
    if (!nodeDef) {
      const nodesDeletedUpdatedResult = deleteNodesByDefUuid({ record: result.record, nodeDefUuid, sideEffect })
      result.merge(nodesDeletedUpdatedResult)
    }
    // remove status flags
    const nodeUpdated = Nodes.removeStatusFlags({ node, sideEffect })
    result.addNode(nodeUpdated, { sideEffect })
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
