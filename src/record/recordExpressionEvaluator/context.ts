import { User } from '../../auth'
import { ExpressionContext } from '../../expression'
import { ArenaRecordNode } from '../../node'
import { CategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { TaxonProvider } from '../../nodeDefExpressionEvaluator/taxonProvider'
import { Survey } from '../../survey'
import { ArenaRecord } from '../record'

export interface RecordExpressionContext extends ExpressionContext {
  user: User
  survey: Survey
  record: ArenaRecord
  prevCycleRecord?: ArenaRecord
  nodeContext: ArenaRecordNode
  nodeCurrent?: ArenaRecordNode
  item?: any
  categoryItemProvider?: CategoryItemProvider
  taxonProvider?: TaxonProvider
}
