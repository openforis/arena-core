import { RecordStep } from 'src/record';
import { Permission } from './permission';

export interface AuthGroup {
  uuid: string
  name: string
  surveyUuid?: string
  permissions: Array<Permission>
  recordSteps: Array<RecordStep>
}
