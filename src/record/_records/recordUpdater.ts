import { Node } from '../../node'
import { Record } from '../record'
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
