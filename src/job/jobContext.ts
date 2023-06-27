import { User } from '../auth'
import { Survey } from '../survey'

export interface JobContext {
  surveyId: number
  survey?: Survey
  type: string
  tx?: any
  user: User
}
