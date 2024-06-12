import { Node, NodeValues } from '../node'
import { NodeKeys, NodeMetaKeys } from '../node/node'
import { Dates, Objects, UUIDs } from '../utils'
import { Record } from './record'
import { RecordValidations } from './recordValidations'
import { Records } from './records'

type OldUuidToNewUuidMap = {
  [key: string]: string
}

const assignNewUuidsToNodes = (params: {
  record: Record
}): { newNodeUuidsByOldUuid: OldUuidToNewUuidMap; newFileUuidsByOldUuid: OldUuidToNewUuidMap } => {
  const { record } = params

  // generate a new uuid for each node
  const newNodeUuidsByOldUuid: OldUuidToNewUuidMap = {}
  const newFileUuidsByOldUuid: OldUuidToNewUuidMap = {}

  // sort nodes before removing the id, to preserve their hierarchy (faster than comparing each meta.h property)
  const nodesArray = Records.getNodesArray(record).sort(
    (nodeA: Node, nodeB: Node): number => (nodeA.id ?? 0) - (nodeB.id ?? 0)
  )

  // update nodes recordUuid and properties (it does side effect on nodes)
  nodesArray.forEach((node) => {
    node.recordUuid = record.uuid
    node.dateCreated = node.dateModified = Dates.nowFormattedForStorage()

    const oldUuid = node.uuid
    const newUuid = UUIDs.v4()
    newNodeUuidsByOldUuid[oldUuid] = newUuid

    node.uuid = newUuid
    // consider every node as just created node
    delete node.id
    node.created = true // this flag will be used by the RDB generator)

    if (!record.nodes) {
      record.nodes = {}
    }
    delete record.nodes[oldUuid]
    record.nodes[newUuid] = node
  })

  // update internal node uuids, meta hierarchy, file uuid (if any)
  nodesArray.forEach((node) => {
    if (node.parentUuid) {
      node.parentUuid = newNodeUuidsByOldUuid[node.parentUuid]
    }
    const hierarchy = node.meta?.h ?? []
    if (hierarchy.length > 0) {
      const hierarchyUpdated = hierarchy.map((ancestorUuid) => newNodeUuidsByOldUuid[ancestorUuid])
      Objects.setInPath({ obj: node, path: [NodeKeys.meta, NodeMetaKeys.h], value: hierarchyUpdated })
    }
    // assign new file uuid (file should be cloned elsewhere)
    const fileUuid = NodeValues.getFileUuid(node)
    if (fileUuid) {
      const newFileUuid = UUIDs.v4()
      Objects.setInPath({ obj: node, path: [NodeKeys.value, NodeValues.valuePropsFile.fileUuid], value: newFileUuid })
      newFileUuidsByOldUuid[fileUuid] = newFileUuid
    }
  })

  return { newNodeUuidsByOldUuid, newFileUuidsByOldUuid }
}

const assignNewUuidsToValidation = (params: { record: Record; newNodeUuidsByOldUuid: OldUuidToNewUuidMap }) => {
  const { record, newNodeUuidsByOldUuid } = params

  const validationFields = record.validation?.fields
  if (!validationFields) return

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
      validationFields[newFieldKey] = validationField
    }
    delete validationFields[oldFieldKey]
  })
}

const assignNewUuids = (
  record: Record
): { newNodeUuidsByOldUuid: OldUuidToNewUuidMap; newFileUuidsByOldUuid: OldUuidToNewUuidMap } => {
  record.uuid = UUIDs.v4()
  record.dateCreated = Dates.nowFormattedForStorage()
  delete record.id

  const { newNodeUuidsByOldUuid, newFileUuidsByOldUuid } = assignNewUuidsToNodes({ record })

  assignNewUuidsToValidation({ record, newNodeUuidsByOldUuid })

  return { newNodeUuidsByOldUuid, newFileUuidsByOldUuid }
}

export const RecordUuidsUpdater = {
  assignNewUuids,
}
