import { JobStatus } from './status'

export enum JobEventType {
  statusChange = 'statusChange',
  progress = 'progress',
}

export interface JobEvent {
  type: JobEventType
  status: JobStatus
  total: number
  processed: number
  errors?: Record<string, any>
}
