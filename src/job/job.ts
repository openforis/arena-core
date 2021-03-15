import { JobStatus } from './status'

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
 *
 * Methods that can be overwritten by subclasses:
 * - onStart
 * - execute
 * - beforeSuccess
 * - beforeEnd
 * - onEnd
 */
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
   * Identifier of the job.
   */
  uuid: string
  /**
   * String representing the Job type.
   */
  type: string
  /**
   * Current status.
   */
  status: JobStatus
  /**
   * Execution start time.
   */
  startTime?: Date
  /**
   * Execution end time.
   */
  endTime?: Date
  /**
   * Number of total items to process.
   */
  total: number
  /**
   * Number of processed items.
   */
  processed?: number
  /**
   * Result of the job.
   */
  result?: R
  /**
   * Errors (when status is failed)
   */
  errors?: any
  /**
   * Inner jobs (if any).
   */
  innerJobs?: Array<Job<any, any, any>>
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
