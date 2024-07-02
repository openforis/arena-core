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
        parentNodes.forEach((parentNode) => {
          const partialUpdateResult = insertMissingSingleNode({
            nodeDef,
            record: updateResult.record,
            parentNode,
            sideEffect,
          })
          if (partialUpdateResult) {
            updateResult.merge(partialUpdateResult)
          }
        })
      }
    },
  })
  return updateResult
}

const fixRecord = (params: { survey: Survey; record: Record; sideEffect?: boolean }): RecordUpdateResult => {
  const { survey, record, sideEffect = false } = params
  const updateResult = new RecordUpdateResult({ record })
  Records.getNodesArray(record).forEach((node) => {
    const { nodeDefUuid } = node
    const nodeDef = Surveys.findNodeDefByUuid({ survey, uuid: nodeDefUuid })
    if (!nodeDef) {
      const nodesToDelete = Records.getNodesByDefUuid(nodeDefUuid)(updateResult.record)

      nodesToDelete.forEach((nodeToDelete) => {
        // cleanup child applicability
        const parentNode = Records.getParent(nodeToDelete)(updateResult.record)
        if (parentNode && !Nodes.isChildApplicable(parentNode, nodeDefUuid)) {
          const parentNodeUpdated = Nodes.dissocChildApplicability(parentNode, nodeDefUuid)
          const recordWithParentNodeUpdated = Records.addNode(parentNodeUpdated, { sideEffect })(updateResult.record)
          updateResult.merge(new RecordUpdateResult({ record: recordWithParentNodeUpdated }))
        }
      })

      const nodeUuidsToDelete = nodesToDelete.map((node) => node.uuid)
      const nodesDeleteUpdateResult = Records.deleteNodes(nodeUuidsToDelete, { sideEffect })(updateResult.record)
      updateResult.merge(nodesDeleteUpdateResult)
    }
  })
  const missingNodesUpdateResult = insertMissingSingleNodes({ survey, record, sideEffect })
  updateResult.merge(missingNodesUpdateResult)
  return updateResult
}

export const RecordFixer = {
  fixRecord,
  insertMissingSingleNodes,
}
