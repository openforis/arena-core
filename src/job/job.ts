import { JobSummary } from './summary'

/**
 * Asynchronous task hanlder.
 *
 * Status workflow:
 * - pending
 * - running
 * - (end)
 * -- succeed
 * -- failed
 * -- canceled
 *  */
export interface Job<P, R, C> {
  /**
   * Execution parameters.
   */
  params?: P
  /**
   * Context object (shared among nested jobs).
   */
  context?: C
  /**
   * Summary of the job with the information about its status.
   */
  summary: JobSummary<R>
  /**
   * Returns true if the job should be executed.
   * It returns true by default.
   */
  shouldExecute(): boolean
  /**
   * Starts the execution of the job.
   */
  start(): void
}
