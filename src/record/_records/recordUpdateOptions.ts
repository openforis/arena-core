import { MutationOptions } from '../../utils/mutationOptions'

export interface RecordUpdateOptions extends MutationOptions {
  updateNodesIndex?: boolean
  sortNodes?: boolean
}

export const RecordUpdateOptionsDefaults: RecordUpdateOptions = {
  updateNodesIndex: true,
  sideEffect: false,
  sortNodes: false,
}
