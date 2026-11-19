import { JobStatus } from './status'

export enum JobEventType {
  statusChange = 'statusChange',
  progress = 'progress',
}

export interface ArenaJobEvent {
  type: JobEventType
  status: JobStatus
  total: number
  processed: number
  errors?: Record<string, any>
}
