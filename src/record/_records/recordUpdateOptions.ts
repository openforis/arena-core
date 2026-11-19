import { ArenaMutationOptions } from '../../utils/mutationOptions'

export interface ArenaRecordUpdateOptions extends ArenaMutationOptions {
  updateNodesIndex?: boolean
  sortNodes?: boolean
}

export const RecordUpdateOptionsDefaults: ArenaRecordUpdateOptions = {
  updateNodesIndex: true,
  sideEffect: false,
  sortNodes: false,
}
