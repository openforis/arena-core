export interface Permissions {
  // TODO
}

export interface RecordSteps {
  // TODO
}

export interface AuthGroup {
  uuid: string
  name: string
  surveyUuid?: string
  permissions: Permissions
  recordSteps: RecordSteps
}
