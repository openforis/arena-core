import { addNodeAndDescendants } from './recordNodesCreator'
import { updateNodesDependents } from './recordNodesUpdater'

export { RecordUpdateResult } from './recordUpdateResult'

export const RecordNodesUpdater = {
  addNodeAndDescendants,
  updateNodesDependents,
}
