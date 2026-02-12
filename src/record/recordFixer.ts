import { Node, NodeFactory, Nodes } from '../node'
import { NodeDef, NodeDefs } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { Objects } from '../utils'
import { Record } from './record'
import { RecordUpdateResult } from './recordNodesUpdater'
import { Records } from './records'

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
  const recordUuid = record.uuid
  const node = NodeFactory.createInstance({ nodeDefUuid, recordUuid, parentNode })
  const recordUpdated = Records.addNode(node, { sideEffect })(record)
  return new RecordUpdateResult({ record: recordUpdated, nodes: { [node.uuid]: node } })
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
  const nodeUuidsToDelete = nodesToDelete.map((node) => node.uuid)
  const nodesDeleteUpdateResult = Records.deleteNodes(nodeUuidsToDelete, { sideEffect })(updateResult.record)
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
  fixRecord,
  insertMissingSingleNodes,
}
