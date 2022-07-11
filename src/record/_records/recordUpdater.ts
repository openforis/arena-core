import { Node } from '../../node'
import { Record } from '../record'
import { RecordNodesIndexUpdater } from './recordNodesIndexUpdater'

export const addNodes =
  (nodes: { [key: string]: Node }, options: { updateNodesIndex: boolean } = { updateNodesIndex: true }) =>
  (record: Record): Record => ({
    ...record,
    nodes: Object.assign({}, record.nodes || {}, nodes),
    ...(options.updateNodesIndex
      ? { _nodesIndex: RecordNodesIndexUpdater.addNodes(nodes)(record._nodesIndex || {}) }
      : {}),
  })

export const addNode =
  (node: Node, options: { updateNodesIndex: boolean } = { updateNodesIndex: true }) =>
  (record: Record) =>
    addNodes({ [node.uuid]: node }, options)(record)
