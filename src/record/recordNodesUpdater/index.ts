import { createDescendants, createNodeAndDescendants } from './recordNodesCreator'
import { updateNodesDependents } from './recordNodesUpdater'
import { deleteNode, deleteNodes } from './recordNodesDeleter'

export { RecordUpdateResult } from './recordUpdateResult'
export type { RecordExpressionEvaluationContext } from './recordExpressionEvaluationContext'
export type { NodeCreateParams, NodesUpdateParams } from './recordNodesCreator'

export const RecordNodesUpdater = {
  createDescendants,
  createNodeAndDescendants,
  updateNodesDependents,
  deleteNode,
  deleteNodes,
}
