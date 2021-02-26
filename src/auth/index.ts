import { Permission } from './permission'

export interface RecordSteps {
  // TODO
}

export interface AuthGroup {
  uuid: string
  name: string
  surveyUuid?: string
  permissions: Array<Permission>
  recordSteps: RecordSteps
}
