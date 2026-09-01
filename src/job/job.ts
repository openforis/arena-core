import { JobSerialized } from './jobSerialized'
import { JobStatus } from './status'

/**
 * Asynchronous task handler.
 *
 * Status workflow:
 * - pending
 * - running
 * - (end)
 * -- succeeded
 * -- failed
 * -- canceled
 *  */
export interface Job<R> {
  readonly uuid: string
  readonly type: string
  status: JobStatus
  /**
   * Starts the execution of the job.
   */
  start(client?: any): Promise<void>
  /**
   * Cancels the execution of the job.
   */
  cancel(options?: { canceledByAdmin?: boolean }): Promise<void>
  /**
   * Generates a plain JSON-serializable representation of the job.
   */
  toJSON(): JobSerialized<R>
}
