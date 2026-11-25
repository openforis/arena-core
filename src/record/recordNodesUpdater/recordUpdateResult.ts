import { ArenaRecordNode, ArenaRecordNodesMap } from '../../node'
import { ArenaValidation } from '../../validation'
import { ArenaRecord } from '../record'
import { addNode, addNodes } from '../_records/recordUpdater'
import { ArenaRecordUpdateOptions } from '../records'

export class RecordUpdateResult {
  record: ArenaRecord
  nodes: ArenaRecordNodesMap
  nodesDeleted: ArenaRecordNodesMap
  clearedDefUuids: Set<string>
  /**
   * Uuids of the nodes (ancestor entities) updated only in their date modified (because a descendant has been modified):
   * to be persisted, but not to be validated again.
   */
  dateModifiedOnlyNodeUuids: Set<string>
  validation?: ArenaValidation

  constructor(params: {
    record: ArenaRecord
    nodes?: ArenaRecordNodesMap
    nodesDeleted?: ArenaRecordNodesMap
    clearedDefUuids?: Set<string>
    validation?: ArenaValidation
  }) {
    this.record = params.record
    this.nodes = params.nodes ?? {}
    this.nodesDeleted = params.nodesDeleted ?? {}
    this.clearedDefUuids = params.clearedDefUuids ?? new Set<string>()
    this.dateModifiedOnlyNodeUuids = new Set<string>()
    this.validation = params.validation
  }

  getNodeByUuid(uuid: string) {
    return this.nodes[uuid]
  }

  addNode(node: ArenaRecordNode, options?: ArenaRecordUpdateOptions) {
    this.nodes[node.uuid] = node
    this.record = addNode(node, options)(this.record)
  }

  addNodes(nodes: ArenaRecordNodesMap, options?: ArenaRecordUpdateOptions) {
    Object.assign(this.nodes, nodes)
    this.record = addNodes(nodes, options)(this.record)
  }

  addClearedDefUuid(nodeDefUuid: string) {
    this.clearedDefUuids.add(nodeDefUuid)
  }

  /**
   * Merges this record update result with the specified one.
   * The record of this record update result will be the one of the specified record update result
   * and the nodes of the specified one will be added to the nodes of this one.
   *
   * @param {!RecordUpdateResult} recordUpdateResult - The record update result to merge with.
   * @returns {RecordUpdateResult} - The updated object.
   */
  merge(recordUpdateResult: RecordUpdateResult): this {
    this.record = recordUpdateResult.record
    Object.assign(this.nodes, recordUpdateResult.nodes)
    Object.assign(this.nodesDeleted, recordUpdateResult.nodesDeleted)
    for (const nodeDefUuid of recordUpdateResult.clearedDefUuids) {
      this.addClearedDefUuid(nodeDefUuid)
    }
    for (const nodeUuid of Object.keys(recordUpdateResult.nodes)) {
      // node updated in the merged result: not only in its date modified anymore
      if (!recordUpdateResult.dateModifiedOnlyNodeUuids.has(nodeUuid)) {
        this.dateModifiedOnlyNodeUuids.delete(nodeUuid)
      }
    }
    for (const nodeUuid of recordUpdateResult.dateModifiedOnlyNodeUuids) {
      this.dateModifiedOnlyNodeUuids.add(nodeUuid)
    }
    return this
  }
}
