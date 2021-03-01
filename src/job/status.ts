export interface JobStatus<R> {
  errors?: { [key: string]: string }
  jobs?: Array<JobStatus<any>>
  status: 'pending' | 'running' | 'succeeded' | 'canceled' | 'failed'
  surveyId: number
  processed: number
  result?: R
  total: number
  type: string
  userUuid: string
}
