import { ArenaUser } from '../auth'
import { ArenaSurvey } from '../survey'

export interface ArenaJobContext {
  surveyId?: number
  survey?: ArenaSurvey
  type?: string
  tx?: any
  user: ArenaUser
}
