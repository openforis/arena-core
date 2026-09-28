import { Node, NodesMap } from '../../node'
import { Record } from '../record'
import * as RecordGetters from './recordGetters'
import { RecordNodesIndexUpdater } from './recordNodesIndexUpdater'
import { RecordUpdateOptions, RecordUpdateOptionsDefaults } from './recordUpdateOptions'

export const addNodes =
  (nodes: NodesMap, options: RecordUpdateOptions = RecordUpdateOptionsDefaults) =>
  (record: Record): Record => {
    const { sideEffect, updateNodesIndex } = { ...RecordUpdateOptionsDefaults, ...options }

    const recordUpdated = sideEffect ? record : { ...record }
    const recordNodes = RecordGetters.getNodes(recordUpdated)

    if (sideEffect) {
      recordUpdated.nodes = Object.assign(recordNodes, nodes)
    } else {
      recordUpdated.nodes = { ...recordNodes, ...nodes }
    }
    // update last internal ID (loop instead of Math.max(...ids): spreading many ids exceeds the call stack size)
    let lastNodeInternalId = record.lastNodeInternalId ?? 0
    for (const node of Object.values(nodes)) {
      if (node.iId > lastNodeInternalId) {
        lastNodeInternalId = node.iId
      }
    }
    recordUpdated.lastNodeInternalId = lastNodeInternalId

    if (updateNodesIndex) {
      recordUpdated._nodesIndex = RecordNodesIndexUpdater.addNodes(nodes, sideEffect)(recordUpdated._nodesIndex ?? {})
    }
    return recordUpdated
  }

export const addNode =
  (node: Node, options: RecordUpdateOptions = RecordUpdateOptionsDefaults) =>
  (record: Record): Record =>
    addNodes({ [node.iId]: node }, options)(record)
