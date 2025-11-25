export interface RecordUpdateOptions {
  updateNodesIndex?: boolean
  sideEffect?: boolean
  sortNodes?: boolean
}

export const RecordUpdateOptionsDefaults: RecordUpdateOptions = {
  updateNodesIndex: true,
  sideEffect: false,
  sortNodes: false,
}
