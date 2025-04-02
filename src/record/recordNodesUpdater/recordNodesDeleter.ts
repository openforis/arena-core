import { Node, NodesMap } from '../../node'
import { Validations } from '../../validation'
import * as RecordGetters from '../_records/recordGetters'
import { RecordNodesIndexUpdater } from '../_records/recordNodesIndexUpdater'
import { RecordUpdateOptions, RecordUpdateOptionsDefaults } from '../_records/recordUpdateOptions'
import { Record } from '../record'
import { RecordValidations } from '../recordValidations'
import { RecordUpdateResult } from './recordUpdateResult'

export const deleteNodes =
  (nodeUuids: string[], options: RecordUpdateOptions = RecordUpdateOptionsDefaults) =>
  (record: Record): RecordUpdateResult => {
    const { sideEffect, updateNodesIndex } = Object.assign({}, RecordUpdateOptionsDefaults, options)

    const recordUpdated = sideEffect ? record : { ...record }

    const recordNodes = RecordGetters.getNodes(recordUpdated)

    const nodesDeleted: NodesMap = {}
    const recordNodesUpdated = sideEffect ? recordNodes : { ...recordNodes }

    let recordNodesIndex = record._nodesIndex ?? {}

    const recordValidation = Validations.getValidation(record)
    let recordValidationUpdated = sideEffect
      ? recordValidation
      : { ...recordValidation, fields: { ...Validations.getFieldValidations(recordValidation) } }

    const deleteDescendantNode = (visitedNode: Node): boolean => {
      const visitedNodeUuid = visitedNode.uuid
      if (nodesDeleted[visitedNodeUuid]) return false

      // 1. delete node from 'nodes'
      delete recordNodesUpdated[visitedNodeUuid]

      const visitedNodeUpdated = sideEffect ? visitedNode : { ...visitedNode }
      visitedNodeUpdated.deleted = true
      nodesDeleted[visitedNodeUuid] = visitedNodeUpdated

      // 2. delete node from validation
      recordValidationUpdated = Validations.dissocFieldValidation(visitedNodeUuid, sideEffect)(recordValidationUpdated)

      recordValidationUpdated = Validations.dissocFieldValidationsStartingWith(
        `${RecordValidations.prefixValidationFieldChildrenCount}${visitedNodeUuid}`,
        sideEffect
      )(recordValidationUpdated)

      // 3. update nodes index
      if (updateNodesIndex) {
        recordNodesIndex = RecordNodesIndexUpdater.removeNode(visitedNode, sideEffect)(recordNodesIndex)
      }
      return false
    }

    nodeUuids.forEach((nodeUuid) => {
      const node = recordNodesUpdated[nodeUuid]
      if (!node) return

      RecordGetters.visitDescendantsAndSelf({
        record,
        node,
        visitor: deleteDescendantNode,
      })
    })

    recordValidationUpdated = Validations.cleanup(recordValidationUpdated)

    recordUpdated.nodes = recordNodesUpdated
    recordUpdated.validation = recordValidationUpdated
    if (updateNodesIndex) {
      recordUpdated._nodesIndex = recordNodesIndex
    }
    return new RecordUpdateResult({ record: recordUpdated, nodes: nodesDeleted, nodesDeleted })
  }

export const deleteNode =
  (nodeUuid: string, options: RecordUpdateOptions = RecordUpdateOptionsDefaults) =>
  (record: Record): RecordUpdateResult =>
    deleteNodes([nodeUuid], options)(record)
