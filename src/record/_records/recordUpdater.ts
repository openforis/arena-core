import { Node } from '../../node'
import { Record } from '../record'
import * as RecordGetters from './recordGetters'
import { RecordNodesIndexUpdater } from './recordNodesIndexUpdater'
import { RecordUpdateOptions, RecordUpdateOptionsDefaults } from './recordUpdateOptions'

export const addNodes =
  (nodes: { [key: string]: Node }, options: RecordUpdateOptions = RecordUpdateOptionsDefaults) =>
  (record: Record): Record => {
    const { sideEffect, updateNodesIndex, sortNodes } = { ...RecordUpdateOptionsDefaults, ...options }

    const recordUpdated = sideEffect ? record : { ...record }
    const recordNodes = RecordGetters.getNodes(recordUpdated)
    const index = recordUpdated._nodesIndex ?? {}

    // index only the nodes not already indexed with the same parent, node def and hierarchy code
    // (e.g. nodes with only an updated value don't need any index change)
    const nodesToIndex: { [key: string]: Node } = {}
    if (updateNodesIndex) {
      for (const [nodeUuid, node] of Object.entries(nodes)) {
        const nodePrev = recordNodes[nodeUuid]
        if (!RecordNodesIndexUpdater.isNodeIndexUnchanged({ index, node, nodePrev })) {
          nodesToIndex[nodeUuid] = node
        }
      }
    }

    if (sideEffect) {
      recordUpdated.nodes = Object.assign(recordNodes, nodes)
    } else {
      recordUpdated.nodes = { ...recordNodes, ...nodes }
    }
    if (updateNodesIndex && Object.keys(nodesToIndex).length > 0) {
      recordUpdated._nodesIndex = RecordNodesIndexUpdater.addNodes(nodesToIndex, sideEffect, sortNodes)(index)
    }
    return recordUpdated
  }

export const addNode =
  (node: Node, options: RecordUpdateOptions = RecordUpdateOptionsDefaults) =>
  (record: Record) =>
    addNodes({ [node.uuid]: node }, options)(record)
