import { User } from '../../auth'
import { CategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { TaxonProvider } from '../../nodeDefExpressionEvaluator/taxonProvider'
import { Survey } from '../../survey'
import { Record } from '../record'

export interface RecordExpressionEvaluationContext {
  user: User
  survey: Survey
  record: Record
  timezoneOffset?: number
  categoryItemProvider?: CategoryItemProvider
  taxonProvider?: TaxonProvider
  sideEffect?: boolean
}
