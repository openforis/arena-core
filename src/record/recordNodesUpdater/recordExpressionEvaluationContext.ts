import { User } from '../../auth'
import { LanguageCode } from '../../language'
import { CategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { TaxonProvider } from '../../nodeDefExpressionEvaluator/taxonProvider'
import { Survey } from '../../survey'
import type { ArenaRecord } from '../record'

export interface RecordExpressionEvaluationContext {
  user: User
  survey: Survey
  record: ArenaRecord
  prevCycleRecord?: ArenaRecord
  timezoneOffset?: number
  lang?: LanguageCode
  categoryItemProvider?: CategoryItemProvider
  taxonProvider?: TaxonProvider
  sideEffect?: boolean
}
