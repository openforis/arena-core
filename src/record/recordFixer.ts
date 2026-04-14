import { NodeFactory, Nodes } from '../node'
import { NodeDef, NodeDefCode, NodeDefs, NodeDefType } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { Objects } from '../utils'
import { ArenaRecord, ArenaRecordNode } from './record'
import { RecordUpdateResult } from './recordNodesUpdater'
import { Records } from './records'

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
  // populate meta.hCode with ancestor code attribute node uuids
  const hCode: string[] = []
  let currentCodeDef: NodeDefCode = nodeDef
  let currentParentCodeAttribute = Records.getParentCodeAttribute({ parentNode, nodeDef: currentCodeDef })(record)
  while (currentParentCodeAttribute) {
    hCode.unshift(currentParentCodeAttribute.uuid)
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
  const recordUuid = record.uuid
  let node = NodeFactory.createInstance({ nodeDefUuid, recordUuid, parentNode })

  if (nodeDef.type === NodeDefType.code) {
    node = fixCodeAttribute({ survey, nodeDef: nodeDef as NodeDefCode, record, node, sideEffect })
  }

  const recordUpdated = Records.addNode(node, { sideEffect })(record)
  return new RecordUpdateResult({ record: recordUpdated, nodes: { [node.uuid]: node } })
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
  const nodeUuidsToDelete = nodesToDelete.map((node) => node.uuid)
  const nodesDeleteUpdateResult = Records.deleteNodes(nodeUuidsToDelete, recordUpdateOptions)(updateResult.record)
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
  fixRecord,
  insertMissingSingleNodes,
}
