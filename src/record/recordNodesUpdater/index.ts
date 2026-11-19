import { addDescendants, addNodeAndDescendants } from './recordNodesCreator'
import { updateNodesDependents } from './recordNodesUpdater'
import { updateRequiredFlags } from './recordNodeDependentsRequiredUpdater'

export { RecordUpdateResult } from './recordUpdateResult'
export type { ArenaRecordExpressionEvaluationContext } from './recordExpressionEvaluationContext'
export type { ArenaRecordNodeCreateParams, ArenaRecordNodesUpdateParams } from './recordNodesCreator'

export const RecordNodesUpdater = {
  /** Low-level: adds the descendants of a node to the record without updating dependents and validation (see RecordUpdater.createDescendants) */
  addDescendants,
  /** Low-level: adds a node and its descendants to the record without updating dependents and validation (see RecordUpdater.createNodeAndDescendants) */
  addNodeAndDescendants,
  updateNodesDependents,
  /** Recomputes the "required if" flags of the specified node defs (e.g. after a survey publish); validation is not updated */
  updateRequiredFlags,
}
