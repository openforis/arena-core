import { JobStatus } from './status'

export interface JobSummary<R> {
  /**
   * Execution end time.
   */
  endTime?: Date
  /**
   * Errors (when status is failed)
   */
  errors?: { [key: string]: string }
  /**
   * Inner jobs (if any).
   */
  jobs?: Array<JobSummary<any>>
  /**
   * Current status of the job.
   */
  status: JobStatus
  /**
   * Identifier of the survey.
   */
  surveyId: number
  /**
   * Number of processed items.
   */
  processed: number
  /**
   * Result of the job.
   */
  result?: R
  /**
   * Execution start time.
   */
  startTime?: Date

  total: number
  /**
   * String representing the Job type.
   */
  type: string
  /**
   * Identifier of the job.
   */
  uuid: string
  /**
   * Identifier of the user that started the job.
   */
  userUuid: string
}
