import { createDescendants, createNodeAndDescendants } from './recordNodesCreator'
import { updateNodesDependents } from './recordNodesUpdater'
import { removeNode, removeNodes } from './recordNodesDeleter'

export { RecordUpdateResult } from './recordUpdateResult'

export const RecordNodesUpdater = {
  createDescendants,
  createNodeAndDescendants,
  updateNodesDependents,
  removeNode,
  removeNodes,
}
