import { Node } from '../../node'
import { Validations } from '../../validation'
import { Record } from '../record'
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

export const deleteNode =
  (node: Node, options: RecordUpdateOptions = RecordUpdateOptionsDefaults) =>
  (record: Record) => {
    const { sideEffect, updateNodesIndex } = Object.assign({}, RecordUpdateOptionsDefaults, options)

    const recordUpdated = sideEffect ? record : { ...record }

    const recordNodes = RecordGetters.getNodes(recordUpdated)

    const recordNodesUpdated = sideEffect ? recordNodes : { ...recordNodes }

    let recordNodesIndex = record._nodesIndex || {}

    const recordValidation = Validations.getValidation(record)
    let recordValidationUpdated = sideEffect
      ? recordValidation
      : { ...recordValidation, fields: { ...Validations.getFieldValidations(recordValidation) } }

    RecordGetters.visitDescendantsAndSelf({
      record,
      node,
      visitor: (visitedNode) => {
        // 1. delete node from 'nodes'
        delete recordNodesUpdated[visitedNode.uuid]

        // 2. delete node from validation
        recordValidationUpdated = Validations.dissocFieldValidation(
          visitedNode.uuid,
          sideEffect
        )(recordValidationUpdated)

        recordValidationUpdated = Validations.dissocFieldValidationsStartingWith(
          `${RecordValidations.prefixValidationFieldChildrenCount}${visitedNode.uuid}`,
          sideEffect
        )(recordValidationUpdated)

        // 3. update nodes index
        if (updateNodesIndex) {
          recordNodesIndex = RecordNodesIndexUpdater.removeNode(visitedNode, sideEffect)(recordNodesIndex)
        }
      },
    })

    recordValidationUpdated = Validations.cleanup(recordValidationUpdated)

    recordUpdated.nodes = recordNodesUpdated
    record.validation = recordValidationUpdated
    if (updateNodesIndex) {
      record._nodesIndex = recordNodesIndex
    }
    return recordUpdated
  }
