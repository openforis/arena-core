import { JobSummary } from './summary'

/**
 * Asynchronous task handler.
 *
 * Status workflow:
 * - pending
 * - running
 * - (end)
 * -- succeed
 * -- failed
 * -- canceled
 *  */
export interface Job<R> {
  /**
   * Summary of the job with the information about its status.
   */
  summary: JobSummary<R>
  /**
   * Starts the execution of the job.
   */
  start(): Promise<void>
  /**
   * Cancels the execution of the job.
   */
  cancel(): Promise<void>
}
