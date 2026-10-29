import { ArenaRecordNode, NodesMap } from '../../node'
import { Validation, Validations } from '../../validation'
import * as RecordGetters from '../_records/recordGetters'
import { RecordNodesIndexUpdater } from '../_records/recordNodesIndexUpdater'
import { RecordUpdateOptions, RecordUpdateOptionsDefaults } from '../_records/recordUpdateOptions'
import { ArenaRecord } from '../record'
import { RecordValidations } from '../recordValidations'
import { RecordUpdateResult } from './recordUpdateResult'

const _getChildrenCountValidationParentUuid = (fieldKey: string): string | undefined => {
  if (!RecordValidations.isValidationChildrenCountKey(fieldKey)) return undefined
  // children count field key format: {prefix}{parentUuid}_{childDefUuid}
  const keyWithoutPrefix = fieldKey.substring(RecordValidations.prefixValidationFieldChildrenCount.length)
  const separatorIndex = keyWithoutPrefix.indexOf('_')
  return separatorIndex >= 0 ? keyWithoutPrefix.substring(0, separatorIndex) : keyWithoutPrefix
}

/**
 * Removes the validation of the deleted nodes and the validation of their children count.
 */
const _dissocValidationFieldsOfDeletedNodes = (params: {
  validation: Validation
  nodesDeleted: NodesMap
  sideEffect: boolean
}): Validation => {
  const { validation, nodesDeleted, sideEffect } = params
  const fields = Validations.getFieldValidations(validation)
  const fieldsUpdated = sideEffect ? fields : { ...fields }
  for (const fieldKey of Object.keys(fieldsUpdated)) {
    const nodeUuid = _getChildrenCountValidationParentUuid(fieldKey) ?? fieldKey
    if (nodesDeleted[nodeUuid]) {
      delete fieldsUpdated[fieldKey]
    }
  }
  if (sideEffect) {
    validation.fields = fieldsUpdated
    return validation
  }
  return { ...validation, fields: fieldsUpdated }
}

export const removeNodes =
  (nodeUuids: string[], options: RecordUpdateOptions = RecordUpdateOptionsDefaults) =>
  (record: ArenaRecord): RecordUpdateResult => {
    const { sideEffect, updateNodesIndex } = { ...RecordUpdateOptionsDefaults, ...options }

    const recordUpdated = sideEffect ? record : { ...record }

    const recordNodes = RecordGetters.getNodes(recordUpdated)

    const nodesDeleted: NodesMap = {}
    const recordNodesUpdated = sideEffect ? recordNodes : { ...recordNodes }

    const deleteDescendantNode = (visitedNode: ArenaRecordNode) => {
      const visitedNodeUuid = visitedNode.uuid
      if (nodesDeleted[visitedNodeUuid]) return

      // delete node from 'nodes'
      delete recordNodesUpdated[visitedNodeUuid]

      const visitedNodeUpdated = sideEffect ? visitedNode : { ...visitedNode }
      visitedNodeUpdated.deleted = true
      nodesDeleted[visitedNodeUuid] = visitedNodeUpdated
    }

    nodeUuids.forEach((nodeUuid) => {
      const node = recordNodesUpdated[nodeUuid]
      if (!node) return

      RecordGetters.visitDescendantsAndSelf(node, deleteDescendantNode)(record)
    })

    // delete nodes from validation (in a single pass over the validation fields)
    recordUpdated.validation = Validations.cleanup(
      _dissocValidationFieldsOfDeletedNodes({
        validation: Validations.getValidation(record),
        nodesDeleted,
        sideEffect: !!sideEffect,
      })
    )

    recordUpdated.nodes = recordNodesUpdated
    // update nodes index (copying every index part only once)
    if (updateNodesIndex) {
      recordUpdated._nodesIndex = RecordNodesIndexUpdater.removeNodes(Object.values(nodesDeleted), { sideEffect })(
        RecordGetters.getNodesIndexOrBuild(record)
      )
    }
    return new RecordUpdateResult({ record: recordUpdated, nodes: nodesDeleted, nodesDeleted })
  }

export const removeNode =
  (nodeUuid: string, options: RecordUpdateOptions = RecordUpdateOptionsDefaults) =>
  (record: ArenaRecord): RecordUpdateResult =>
    removeNodes([nodeUuid], options)(record)
