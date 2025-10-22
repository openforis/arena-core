import { NodeDefCode, NodeDefType, NodeDefs } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { Dates, UUIDs } from '../utils'
import { Record } from './record'
import { RecordFixer } from './recordFixer'
import { RecordUpdateResult } from './recordNodesUpdater'
import { Records } from './records'

const assignNewUuid = (params: { record: Record; sideEffect: boolean }): { record: Record } => {
  const { record, sideEffect } = params
  const recordUpdated = sideEffect ? record : { ...record }
  recordUpdated.uuid = UUIDs.v4()
  return { record: recordUpdated }
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

const cloneRecord = (params: { survey: Survey; record: Record; cycleTo: string; sideEffect?: boolean }) => {
  const { survey, record, cycleTo, sideEffect = false } = params

  let recordUpdated = sideEffect ? record : structuredClone(record)
  recordUpdated.cycle = cycleTo
  recordUpdated.dateCreated = recordUpdated.dateModified = Dates.nowFormattedForStorage()

  // delete IDs: used only for storage
  delete recordUpdated.id
  for (const node of Records.getNodesArray(recordUpdated)) {
    delete node.id
  }

  const { record: recordUpdatedUuids } = assignNewUuid({ record, sideEffect })
  recordUpdated = recordUpdatedUuids

  // delete nodes not included in clone
  const updateResult = new RecordUpdateResult({ record: recordUpdated })
  updateResult.merge(removeExcludedNodes({ survey, record: updateResult.record, sideEffect }))
  updateResult.merge(RecordFixer.insertMissingSingleNodes({ survey, record: updateResult.record, sideEffect }))

  recordUpdated = updateResult.record

  return { record: recordUpdated }
}

export const RecordCloner = {
  cloneRecord,
}
