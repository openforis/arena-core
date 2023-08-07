import { Node, NodesMap } from '../../node'
import { Validations } from '../../validation'
import { Record } from '../record'
import { RecordUpdateResult } from '../recordNodesUpdater'
import { RecordValidations } from '../recordValidations'
import * as RecordGetters from './recordGetters'
import { RecordNodesIndexUpdater } from './recordNodesIndexUpdater'

export interface RecordUpdateOptions {
  updateNodesIndex?: boolean
  sideEffect?: boolean
}

const RecordUpdateOptionsDefaults: RecordUpdateOptions = {
  updateNodesIndex: true,
  sideEffect: false,
}

export const addNodes =
  (nodes: { [key: string]: Node }, options: RecordUpdateOptions = RecordUpdateOptionsDefaults) =>
  (record: Record): Record => {
    const { sideEffect, updateNodesIndex } = Object.assign({}, RecordUpdateOptionsDefaults, options)

    const recordUpdated = sideEffect ? record : { ...record }
    const recordNodes = RecordGetters.getNodes(recordUpdated)

    if (sideEffect) {
      recordUpdated.nodes = Object.assign(recordNodes, nodes)
    } else {
      recordUpdated.nodes = Object.assign({}, recordNodes, nodes)
    }
    if (updateNodesIndex) {
      recordUpdated._nodesIndex = RecordNodesIndexUpdater.addNodes(nodes, sideEffect)(recordUpdated._nodesIndex || {})
    }
    return recordUpdated
  }

export const addNode =
  (node: Node, options: RecordUpdateOptions = RecordUpdateOptionsDefaults) =>
  (record: Record) =>
    addNodes({ [node.uuid]: node }, options)(record)

export const deleteNodes =
  (nodeUuids: string[], options: RecordUpdateOptions = RecordUpdateOptionsDefaults) =>
  (record: Record): RecordUpdateResult => {
    const { sideEffect, updateNodesIndex } = Object.assign({}, RecordUpdateOptionsDefaults, options)

    const recordUpdated = sideEffect ? record : { ...record }

    const recordNodes = RecordGetters.getNodes(recordUpdated)

    const nodesDeleted: NodesMap = {}
    const recordNodesUpdated = sideEffect ? recordNodes : { ...recordNodes }

    let recordNodesIndex = record._nodesIndex || {}

    const recordValidation = Validations.getValidation(record)
    let recordValidationUpdated = sideEffect
      ? recordValidation
      : { ...recordValidation, fields: { ...Validations.getFieldValidations(recordValidation) } }

    nodeUuids.forEach((nodeUuid) => {
      const node = recordNodesUpdated[nodeUuid]
      if (!node) return
      RecordGetters.visitDescendantsAndSelf({
        record,
        node,
        visitor: (visitedNode) => {
          const visitedNodeUuid = visitedNode.uuid
          if (nodesDeleted[visitedNodeUuid]) return

          // 1. delete node from 'nodes'
          delete recordNodesUpdated[visitedNodeUuid]

          const visitedNodeUpdated = sideEffect ? visitedNode : { ...visitedNode }
          visitedNodeUpdated.deleted = true
          nodesDeleted[visitedNodeUuid] = visitedNodeUpdated

          // 2. delete node from validation
          recordValidationUpdated = Validations.dissocFieldValidation(
            visitedNodeUuid,
            sideEffect
          )(recordValidationUpdated)

          recordValidationUpdated = Validations.dissocFieldValidationsStartingWith(
            `${RecordValidations.prefixValidationFieldChildrenCount}${visitedNodeUuid}`,
            sideEffect
          )(recordValidationUpdated)

          // 3. update nodes index
          if (updateNodesIndex) {
            recordNodesIndex = RecordNodesIndexUpdater.removeNode(visitedNode, sideEffect)(recordNodesIndex)
          }
        },
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
