import { Node, NodesMap } from '../../node'
import { Validation } from '../../validation'
import { Record } from '../record'
import { addNode } from '../_records/recordUpdater'

export class RecordUpdateResult {
  record: Record
  nodes: NodesMap
  nodesDeleted: NodesMap
  validation?: Validation

  constructor(params: { record: Record; nodes?: NodesMap; nodesDeleted?: NodesMap; validation?: Validation }) {
    this.record = params.record
    this.nodes = params.nodes ?? {}
    this.nodesDeleted = params.nodesDeleted ?? {}
    this.validation = params.validation
  }

  getNodeByUuid(uuid: string) {
    return this.nodes[uuid]
  }

  addNode(node: Node, options?: { sideEffect: boolean }) {
    const { sideEffect = false } = options ?? {}
    this.nodes[node.uuid] = node
    this.record = addNode(node, { sideEffect })(this.record)
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
    return this
  }
}
