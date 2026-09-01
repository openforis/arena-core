import { JobStatus } from './status'

/**
 * Plain JSON-serializable representation of a job, produced by JobBase#toJSON.
 */
export interface JobSerialized<R = undefined> {
  uuid: string
  type: string
  userUuid: string | undefined
  surveyId: number | null
  innerJobs: JobSerialized<any>[]
  currentInnerJobIndex: number

  // Status
  status: JobStatus
  pending: boolean
  running: boolean
  succeeded: boolean
  canceled: boolean
  failed: boolean
  ended: boolean

  // Progress
  total: number
  processed: number
  progressPercent: number
  elapsedMillis: number

  // Output
  errors?: Record<string, any>
  result?: R
}
