import { addDescendants, addNodeAndDescendants } from './recordNodesCreator'
import { updateNodesDependents } from './recordNodesUpdater'
import { removeNode, removeNodes } from './recordNodesDeleter'

export { RecordUpdateResult } from './recordUpdateResult'
export type { RecordExpressionEvaluationContext } from './recordExpressionEvaluationContext'
export type { NodeCreateParams, NodesUpdateParams } from './recordNodesCreator'

export const RecordNodesUpdater = {
  /** Low-level: adds the descendants of a node to the record without updating dependents and validation (see RecordUpdater.createDescendants) */
  addDescendants,
  /** Low-level: adds a node and its descendants to the record without updating dependents and validation (see RecordUpdater.createNodeAndDescendants) */
  addNodeAndDescendants,
  updateNodesDependents,
  /** @deprecated Use addDescendants (or RecordUpdater.createDescendants to update dependents and validation too) */
  createDescendants: addDescendants,
  /** @deprecated Use addNodeAndDescendants (or RecordUpdater.createNodeAndDescendants to update dependents and validation too) */
  createNodeAndDescendants: addNodeAndDescendants,
  /** @deprecated Use Records.removeNode (or RecordUpdater.deleteNode to update dependents and validation too) */
  deleteNode: removeNode,
  /** @deprecated Use Records.removeNodes (or RecordUpdater.deleteNodes to update dependents and validation too) */
  deleteNodes: removeNodes,
}
