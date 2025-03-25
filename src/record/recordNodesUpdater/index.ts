import { createDescendants, createNodeAndDescendants } from './recordNodesCreator'
import { updateNodesDependents } from './recordNodesUpdater'
import { deleteNode, deleteNodes } from './recordNodesDeleter'

export { RecordUpdateResult } from './recordUpdateResult'

export const RecordNodesUpdater = {
  createDescendants,
  createNodeAndDescendants,
  updateNodesDependents,
  deleteNode,
  deleteNodes,
}
