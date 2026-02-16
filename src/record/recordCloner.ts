import { Node, NodeKeys, Nodes, NodeValues } from '../node'
import { NodeDefCode, NodeDefType, NodeDefs } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { Dates, Objects, UUIDs } from '../utils'
import { Record } from './record'
import { RecordFixer } from './recordFixer'
import { RecordUpdateResult } from './recordNodesUpdater'
import { Records } from './records'

const assignNewUuid = ({ record }: { record: Record }) => {
  record.uuid = UUIDs.v4()
  return { record }
}

type OldUuidToNewUuidMap = {
  [key: string]: string
}

const updateNodesForClone = (params: {
  record: Record
  nodesArray: Node[]
  sideEffect: boolean
}): { newFileUuidsByOldUuid: OldUuidToNewUuidMap; record: Record } => {
  const { record, nodesArray, sideEffect } = params

  const newFileUuidsByOldUuid: OldUuidToNewUuidMap = {}

  const recordUpdated = sideEffect ? record : { ...record }
  const nodes = recordUpdated.nodes ?? {}
  const nodesUpdated = sideEffect ? nodes : { ...nodes }

  // update nodes recordUuid, remove storage id, and update file uuid (side effects on nodes)
  for (const node of nodesArray) {
    let nodeUpdated = sideEffect ? node : { ...node }
    delete nodeUpdated.id
    nodeUpdated.recordUuid = record.uuid

    // assign new file uuid (file should be cloned elsewhere)
    const fileUuid = NodeValues.getFileUuid(node)
    if (fileUuid) {
      const newFileUuid = UUIDs.v4()
      nodeUpdated = Objects.assocPath({
        obj: nodeUpdated,
        path: [NodeKeys.value, NodeValues.ValuePropsFile.fileUuid],
        value: newFileUuid,
        sideEffect,
      })
      newFileUuidsByOldUuid[fileUuid] = newFileUuid
    }
    nodesUpdated[node.iId] = nodeUpdated
  }
  recordUpdated.nodes = nodesUpdated

  return { newFileUuidsByOldUuid, record: recordUpdated }
}

const removeExcludedNodes = (params: { survey: Survey; record: Record; sideEffect: boolean }): RecordUpdateResult => {
  const { survey, record, sideEffect } = params
  const cycle = record.cycle!
  const result = new RecordUpdateResult({ record })
  Surveys.visitDescendantsAndSelfNodeDef({
    survey,
    cycle,
    nodeDef: Surveys.getNodeDefRoot({ survey }),
    visitor: (nodeDef) => {
      const hasAncestorCodeDefExcludedInClone =
        nodeDef.type === NodeDefType.code &&
        !!Surveys.getNodeDefAncestorCodes({ survey, nodeDef: nodeDef as NodeDefCode }).find(NodeDefs.isExcludedInClone)

      if (
        !NodeDefs.isInCycle(cycle)(nodeDef) ||
        NodeDefs.isExcludedInClone(nodeDef) ||
        hasAncestorCodeDefExcludedInClone
      ) {
        const nodesToDelete = Records.getNodesByDefUuid(nodeDef.uuid)(result.record)
        if (nodesToDelete.length > 0) {
          const nodesInternalIds = nodesToDelete.map((node) => node.iId)
          const partialUpdateResult = Records.deleteNodes(nodesInternalIds, { sideEffect })(result.record)
          result.merge(partialUpdateResult)
        }
      }
    },
  })
  return result
}

const cloneRecord = (params: {
  survey: Survey
  record: Record
  cycleTo: string
  sideEffect?: boolean
}): {
  record: Record
  newFileUuidsByOldUuid: OldUuidToNewUuidMap
} => {
  const { survey, record, cycleTo, sideEffect = false } = params

  let recordUpdated = sideEffect ? record : structuredClone(record)
  recordUpdated.cycle = cycleTo
  recordUpdated.dateCreated = recordUpdated.dateModified = Dates.nowFormattedForStorage()

  // delete IDs: used only for storage
  delete recordUpdated.id

  const { record: recordUpdatedUuid } = assignNewUuid({ record: recordUpdated })
  recordUpdated = recordUpdatedUuid

  // delete nodes not included in clone
  const updateResult = new RecordUpdateResult({ record: recordUpdated })
  updateResult.merge(removeExcludedNodes({ survey, record: updateResult.record, sideEffect }))
  updateResult.merge(RecordFixer.insertMissingSingleNodes({ survey, record: updateResult.record, sideEffect }))

  recordUpdated = updateResult.record

  // preserve hierarchy order during node updates
  const nodesArray = Records.getNodesArray(recordUpdated).sort(
    (nodeA: Node, nodeB: Node): number => Nodes.getHierarchy(nodeA).length - Nodes.getHierarchy(nodeB).length
  )
  const { newFileUuidsByOldUuid, record: recordUpdatedUuids } = updateNodesForClone({
    record: recordUpdated,
    nodesArray,
    sideEffect,
  })

  return { record: recordUpdatedUuids, newFileUuidsByOldUuid }
}

export const RecordCloner = {
  cloneRecord,
}
