import { createDescendants, createNodeAndDescendants } from './recordNodesCreator'
import { updateNodesDependents } from './recordNodesUpdater'
import { deleteNode, deleteNodes } from './recordNodesDeleter'

export { RecordUpdateResult } from './recordUpdateResult'
export type { RecordExpressionEvaluationContext } from './recordExpressionEvaluationContext'
export type { NodeCreateParams, NodesUpdateParams } from './recordNodesCreator'

export const RecordNodesUpdater = {
  /** Low-level: creates the descendants of a node without updating dependents and validation (see RecordUpdater.createDescendants) */
  createDescendants,
  /** Low-level: creates a node and its descendants without updating dependents and validation (see RecordUpdater.createNodeAndDescendants) */
  createNodeAndDescendants,
  updateNodesDependents,
  /** Low-level: deletes the node and its descendants without updating dependents and validation (see RecordUpdater.deleteNode) */
  deleteNode,
  /** Low-level: deletes the nodes and their descendants without updating dependents and validation (see RecordUpdater.deleteNodes) */
  deleteNodes,
}
