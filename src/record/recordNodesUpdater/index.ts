import { addDescendants, addNodeAndDescendants } from './recordNodesCreator'
import { updateNodesDependents } from './recordNodesUpdater'
import { removeNode, removeNodes } from './recordNodesDeleter'
import { updateRequiredFlags } from './recordNodeDependentsRequiredUpdater'

export { RecordUpdateResult } from './recordUpdateResult'
export type { RecordExpressionEvaluationContext } from './recordExpressionEvaluationContext'
export type { NodeCreateParams, NodesUpdateParams } from './recordNodesCreator'

export const RecordNodesUpdater = {
  /** Low-level: adds the descendants of a node to the record without updating dependents and validation (see RecordUpdater.createDescendants) */
  addDescendants,
  /** Low-level: adds a node and its descendants to the record without updating dependents and validation (see RecordUpdater.createNodeAndDescendants) */
  addNodeAndDescendants,
  updateNodesDependents,
  /** Recomputes the "required if" flags of the specified node defs (e.g. after a survey publish); validation is not updated */
  updateRequiredFlags,
  /** @deprecated Use addDescendants (or RecordUpdater.createDescendants to update dependents and validation too) */
  createDescendants: addDescendants,
  /** @deprecated Use addNodeAndDescendants (or RecordUpdater.createNodeAndDescendants to update dependents and validation too) */
  createNodeAndDescendants: addNodeAndDescendants,
  /** @deprecated Use Records.removeNode (or RecordUpdater.deleteNode to update dependents and validation too) */
  deleteNode: removeNode,
  /** @deprecated Use Records.removeNodes (or RecordUpdater.deleteNodes to update dependents and validation too) */
  deleteNodes: removeNodes,
}
