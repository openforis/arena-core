import { Node } from '../../node'
import { Record } from '../record'

export class RecordUpdateResult {
  record: Record
  nodes: { [key: string]: Node }

  constructor(params: { record: Record; nodes?: { [key: string]: Node } }) {
    this.record = params.record
    this.nodes = params.nodes || {}
  }

  getNodeByUuid(uuid: string) {
    return this.nodes[uuid]
  }

  addNode(node: Node) {
    this.nodes[node.uuid] = node
  }

  /**
   * Merges this record update result with the specified one.
   * The record of this record update result will be the one of the specified record update result
   * and the nodes of the specified one will be added to the nodes of this one.
   *
   * @param {!RecordUpdateResult} recordUpdateResult - The record update result to merge with.
   * @returns {RecordUpdateResult} - The updated object.
   */
  merge(recordUpdateResult: RecordUpdateResult): RecordUpdateResult {
    this.record = recordUpdateResult.record
    Object.assign(this.nodes, recordUpdateResult.nodes)
    return this
  }
}
