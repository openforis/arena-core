import { createNodeAndDescendants } from './recordNodesCreator'
import { updateNodesDependents } from './recordNodesUpdater'
import { removeNode, removeNodes } from './recordNodesDeleter'

export { RecordUpdateResult } from './recordUpdateResult'

export const RecordNodesUpdater = {
  createNodeAndDescendants,
  updateNodesDependents,
  removeNode,
  removeNodes,
}
