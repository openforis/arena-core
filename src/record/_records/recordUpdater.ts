import { ArenaRecordNode } from '../../node'
import { ArenaRecord } from '../record'
import * as RecordGetters from './recordGetters'
import { RecordNodesIndexUpdater } from './recordNodesIndexUpdater'
import { RecordUpdateOptions, RecordUpdateOptionsDefaults } from './recordUpdateOptions'

export const addNodes =
  (nodes: { [key: string]: ArenaRecordNode }, options: RecordUpdateOptions = RecordUpdateOptionsDefaults) =>
  (record: ArenaRecord): ArenaRecord => {
    const { sideEffect, updateNodesIndex, sortNodes } = { ...RecordUpdateOptionsDefaults, ...options }

    const recordUpdated = sideEffect ? record : { ...record }
    const recordNodes = RecordGetters.getNodes(recordUpdated)
    // index got before adding the new nodes (a missing index is built from the current record nodes)
    const index = updateNodesIndex ? RecordGetters.getNodesIndexOrBuild(recordUpdated) : {}

    // index only the nodes not already indexed with the same parent, node def and hierarchy code
    // (e.g. nodes with only an updated value don't need any index change)
    const nodesToIndex: { [key: string]: ArenaRecordNode } = {}
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
    if (updateNodesIndex) {
      // store the index even with no nodes to add: it could have just been built, avoid building it again
      recordUpdated._nodesIndex =
        Object.keys(nodesToIndex).length > 0
          ? RecordNodesIndexUpdater.addNodes(nodesToIndex, { sideEffect, sortNodes })(index)
          : index
    }
    return recordUpdated
  }

export const addNode =
  (node: ArenaRecordNode, options: RecordUpdateOptions = RecordUpdateOptionsDefaults) =>
  (record: ArenaRecord) =>
    addNodes({ [node.uuid]: node }, options)(record)
