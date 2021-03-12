import { JobStatus } from './status'

export interface JobSummary<R> {
  errors?: { [key: string]: string }
  jobs?: Array<JobSummary<any>>
  status: JobStatus
  surveyId: number
  processed: number
  result?: R
  total: number
  type: string
  userUuid: string
}
