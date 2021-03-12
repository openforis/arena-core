import { JobStatus } from './status'

export abstract class Job<R> {
  params: any // Execution parameters
  context: any // Context object (shared among nested jobs)

  uuid: string
  type: string // string representing the Job type

  status = JobStatus
  startTime: Date
  endTime: Date
  total: number

  processed: number
  result: R
  errors: any
  innerJobs: Array<Job<any>>
  currentInnerJobIndex: number

  eventListener: any

  async shouldExecute(): Promise<boolean> {
    return true
  }
}
