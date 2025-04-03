export interface RecordUpdateOptions {
  updateNodesIndex?: boolean
  sideEffect?: boolean
}

export const RecordUpdateOptionsDefaults: RecordUpdateOptions = {
  updateNodesIndex: true,
  sideEffect: false,
}
