import { createNodeAndDescendants } from './recordNodesCreator'
import { updateNodesDependents } from './recordNodesUpdater'

export { RecordUpdateResult } from './recordUpdateResult'

export const RecordNodesUpdater = {
  createNodeAndDescendants,
  updateNodesDependents,
}
