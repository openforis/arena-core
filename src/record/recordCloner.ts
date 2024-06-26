import { Node, NodeFactory, NodeValues, Nodes } from '../node'
import { NodeKeys, NodeMetaKeys } from '../node/node'
import { NodeDef, NodeDefs } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { Dates, Objects, UUIDs } from '../utils'
import { Validation } from '../validation'
import { Record } from './record'
import { RecordUpdateResult } from './recordNodesUpdater'
import { RecordValidations } from './recordValidations'
import { Records } from './records'

type OldUuidToNewUuidMap = {
  [key: string]: string
}

const assignNewUuidsToNodes = (params: {
  record: Record
  sideEffect: boolean
}): { newNodeUuidsByOldUuid: OldUuidToNewUuidMap; newFileUuidsByOldUuid: OldUuidToNewUuidMap; record: Record } => {
  const { record, sideEffect } = params

  // generate a new uuid for each node
  const newNodeUuidsByOldUuid: OldUuidToNewUuidMap = {}
  const newFileUuidsByOldUuid: OldUuidToNewUuidMap = {}

  // sort nodes before removing the id, to preserve their hierarchy (faster than comparing each meta.h property)
  const nodesArray = Records.getNodesArray(record).sort(
    (nodeA: Node, nodeB: Node): number => Nodes.getHierarchy(nodeA).length - Nodes.getHierarchy(nodeB).length
  )

  const recordUpdated = sideEffect ? record : { ...record }

  const nodes = recordUpdated.nodes ?? {}
  const nodesUpdated = sideEffect ? nodes : { ...nodes }

  // update nodes recordUuid and properties (it does side effect on nodes)
  nodesArray.forEach((node) => {
    let nodeUpdated = sideEffect ? node : { ...node }
    nodeUpdated.recordUuid = record.uuid
    nodeUpdated.dateCreated = nodeUpdated.dateModified = Dates.nowFormattedForStorage()

    const oldUuid = node.uuid
    const newUuid = UUIDs.v4()
    newNodeUuidsByOldUuid[oldUuid] = newUuid

    nodeUpdated.uuid = newUuid
    // consider every node as just created node
    delete nodeUpdated.id
    nodeUpdated.created = true // this flag will be used by the RDB generator)

    // update internal node uuids, meta hierarchy, file uuid (if any)
    const parentUuid = node.parentUuid
    if (parentUuid) {
      nodeUpdated.parentUuid = newNodeUuidsByOldUuid[parentUuid]
    }
    const hierarchy = node.meta?.h ?? []
    if (hierarchy.length > 0) {
      const hierarchyUpdated = hierarchy.map((ancestorUuid) => newNodeUuidsByOldUuid[ancestorUuid])
      nodeUpdated = Objects.assocPath({
        obj: nodeUpdated,
        path: [NodeKeys.meta, NodeMetaKeys.h],
        value: hierarchyUpdated,
        sideEffect,
      })
    }
    // assign new file uuid (file should be cloned elsewhere)
    const fileUuid = NodeValues.getFileUuid(node)
    if (fileUuid) {
      const newFileUuid = UUIDs.v4()
      nodeUpdated = Objects.assocPath({
        obj: nodeUpdated,
        path: [NodeKeys.value, NodeValues.valuePropsFile.fileUuid],
        value: newFileUuid,
      })
      newFileUuidsByOldUuid[fileUuid] = newFileUuid
    }

    delete nodesUpdated[oldUuid]
    nodesUpdated[newUuid] = nodeUpdated
  })

  recordUpdated.nodes = nodesUpdated

  return { newNodeUuidsByOldUuid, newFileUuidsByOldUuid, record: recordUpdated }
}

const assignNewUuidsToValidation = (params: {
  validation: Validation
  newNodeUuidsByOldUuid: OldUuidToNewUuidMap
  sideEffect: boolean
}): Validation => {
  const { validation, newNodeUuidsByOldUuid, sideEffect } = params

  const validationFields = validation?.fields
  if (!validationFields) return validation

  const validationFieldsUpdated = sideEffect ? validationFields : { ...validationFields }

  Object.entries(validationFields).forEach(([oldFieldKey, validationField]) => {
    let newFieldKey
    if (oldFieldKey.startsWith(RecordValidations.prefixValidationFieldChildrenCount)) {
      const oldParentUuid = oldFieldKey.substring(
        RecordValidations.prefixValidationFieldChildrenCount.length,
        oldFieldKey.lastIndexOf('_')
      )
      const newParentUuid = newNodeUuidsByOldUuid[oldParentUuid]
      newFieldKey = oldFieldKey.replace(oldParentUuid, newParentUuid)
    } else {
      newFieldKey = newNodeUuidsByOldUuid[oldFieldKey]
    }
    if (newFieldKey) {
      validationFieldsUpdated[newFieldKey] = validationField
    }
    delete validationFieldsUpdated[oldFieldKey]
  })
  return Objects.assoc({
    obj: validation,
    prop: 'fields',
    value: validationFieldsUpdated,
    sideEffect,
  })
}

const assignNewUuids = (params: {
  record: Record
  sideEffect: boolean
}): { newNodeUuidsByOldUuid: OldUuidToNewUuidMap; newFileUuidsByOldUuid: OldUuidToNewUuidMap; record: Record } => {
  const { record, sideEffect } = params
  let recordUpdated = sideEffect ? record : { ...record }
  recordUpdated.uuid = UUIDs.v4()

  const {
    newNodeUuidsByOldUuid,
    newFileUuidsByOldUuid,
    record: recordUpdatedUuids,
  } = assignNewUuidsToNodes({ record: recordUpdated, sideEffect })

  recordUpdated = recordUpdatedUuids

  const { validation } = recordUpdated
  if (validation) {
    const validationUpdated = assignNewUuidsToValidation({
      validation,
      newNodeUuidsByOldUuid,
      sideEffect,
    })
    recordUpdated = Objects.assoc({ obj: recordUpdated, prop: 'validation', value: validationUpdated, sideEffect })
  }
  // re-build nodes index
  const nodes = recordUpdated.nodes!
  delete recordUpdated._nodesIndex
  delete recordUpdated.nodes
  recordUpdated = Records.addNodes(nodes, { sideEffect })(recordUpdated)

  return { newNodeUuidsByOldUuid, newFileUuidsByOldUuid, record: recordUpdated }
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

const removeExcludedNodes = (params: { survey: Survey; record: Record; sideEffect: boolean }): RecordUpdateResult => {
  const { survey, record, sideEffect } = params
  const cycle = record.cycle!
  const result = new RecordUpdateResult({ record })
  Object.values(survey.nodeDefs ?? {}).forEach((nodeDef) => {
    if (!NodeDefs.isInCycle(cycle)(nodeDef) || NodeDefs.isExcludedInClone(nodeDef)) {
      const nodesToDelete = Records.getNodesByDefUuid(nodeDef.uuid)(result.record)
      if (nodesToDelete.length > 0) {
        const partialUpdateResult = Records.deleteNodes(
          nodesToDelete.map((node) => node.uuid),
          { sideEffect }
        )(result.record)
        result.merge(partialUpdateResult)
      }
    }
  })
  return result
}

const cloneRecord = (params: { survey: Survey; record: Record; cycleTo: string; sideEffect?: boolean }) => {
  const { survey, record, cycleTo, sideEffect = false } = params

  const recordUpdated = sideEffect ? record : { ...record }
  recordUpdated.cycle = cycleTo
  recordUpdated.dateCreated = recordUpdated.dateModified = Dates.nowFormattedForStorage()
  delete recordUpdated.id

  // delete nodes not included in clone
  const updateResult = new RecordUpdateResult({ record: recordUpdated })
  updateResult.merge(removeExcludedNodes({ survey, record: updateResult.record, sideEffect }))
  updateResult.merge(insertMissingSingleNodes({ survey, record: updateResult.record, sideEffect }))

  // assign new UUIDs with side effect on record and nodes, faster when record is big
  const {
    newNodeUuidsByOldUuid,
    newFileUuidsByOldUuid,
    record: recordUpdatedUuids,
  } = assignNewUuids({ record: updateResult.record, sideEffect })

  updateResult.merge(new RecordUpdateResult({ record: recordUpdatedUuids }))

  return { record: updateResult.record, newNodeUuidsByOldUuid, newFileUuidsByOldUuid }
}

export const RecordCloner = {
  cloneRecord,
}
