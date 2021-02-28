import { Permission } from './permission'

export interface AuthGroup {
  name: string
  surveyUuid?: string
  permissions: Array<Permission>
  recordSteps: string // TODO RecordSteps
  uuid: string
}
