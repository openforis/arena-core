import { Node, NodesMap } from '../../node'
import { Validations } from '../../validation'
import * as RecordGetters from '../_records/recordGetters'
import { RecordNodesIndexUpdater } from '../_records/recordNodesIndexUpdater'
import { RecordUpdateOptions, RecordUpdateOptionsDefaults } from '../_records/recordUpdateOptions'
import { Record } from '../record'
import { RecordValidations } from '../recordValidations'
import { RecordUpdateResult } from './recordUpdateResult'

export const deleteNodes =
  (nodeInternalIds: number[], options: RecordUpdateOptions = RecordUpdateOptionsDefaults) =>
  (record: Record): RecordUpdateResult => {
    const { sideEffect, updateNodesIndex } = { ...RecordUpdateOptionsDefaults, ...options }

    const recordUpdated = sideEffect ? record : { ...record }

    const recordNodes = RecordGetters.getNodes(recordUpdated)

    const nodesDeleted: NodesMap = {}
    const recordNodesUpdated = sideEffect ? recordNodes : { ...recordNodes }

    let recordNodesIndex = record._nodesIndex ?? {}

    const recordValidation = Validations.getValidation(record)
    let recordValidationUpdated = sideEffect
      ? recordValidation
      : { ...recordValidation, fields: { ...Validations.getFieldValidations(recordValidation) } }

    const deleteDescendantNode = (visitedNode: Node) => {
      const { iId: visitedNodeInternalId } = visitedNode
      if (nodesDeleted[visitedNodeInternalId]) return

      // 1. delete node from 'nodes'
      delete recordNodesUpdated[visitedNodeInternalId]

      const visitedNodeUpdated = sideEffect ? visitedNode : { ...visitedNode }
      visitedNodeUpdated.deleted = true
      nodesDeleted[visitedNodeInternalId] = visitedNodeUpdated

      // 2. delete node from validation
      recordValidationUpdated = Validations.dissocFieldValidation(
        String(visitedNodeInternalId),
        sideEffect
      )(recordValidationUpdated)

      recordValidationUpdated = Validations.dissocFieldValidationsStartingWith(
        `${RecordValidations.prefixValidationFieldChildrenCount}${visitedNodeInternalId}`,
        sideEffect
      )(recordValidationUpdated)

      // 3. update nodes index
      if (updateNodesIndex) {
        recordNodesIndex = RecordNodesIndexUpdater.removeNode(visitedNode, sideEffect)(recordNodesIndex)
      }
    }

    nodeInternalIds.forEach((nodeInternalId) => {
      const node = recordNodesUpdated[nodeInternalId]
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
  (internalId: number, options: RecordUpdateOptions = RecordUpdateOptionsDefaults) =>
  (record: Record): RecordUpdateResult =>
    deleteNodes([internalId], options)(record)
