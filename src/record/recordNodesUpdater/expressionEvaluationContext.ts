import { Survey } from '../../survey'
import { Record } from '../record'
import { User } from '../../auth'

export interface ExpressionEvaluationContext {
  user: User
  survey: Survey
  record: Record
  timezoneOffset?: number
  sideEffect?: boolean
  deleteNotApplicableEnumeratedEntities?: boolean
}
