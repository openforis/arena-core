import { ArenaUser } from '../../auth'
import { ArenaExpressionContext } from '../../expression'
import { ArenaRecordNode } from '../../node'
import { ArenaAreaOfInterestProvider } from '../../nodeDefExpressionEvaluator/areaOfInterestProvider'
import { ArenaCategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { ArenaTaxonProvider } from '../../nodeDefExpressionEvaluator/taxonProvider'
import { ArenaSurvey } from '../../survey'
import { ArenaRecord } from '../record'

export interface ArenaRecordExpressionContext extends ArenaExpressionContext {
  user: ArenaUser
  survey: ArenaSurvey
  record: ArenaRecord
  prevCycleRecord?: ArenaRecord
  nodeContext: ArenaRecordNode
  nodeCurrent?: ArenaRecordNode
  item?: any
  categoryItemProvider?: ArenaCategoryItemProvider
  taxonProvider?: ArenaTaxonProvider
  areaOfInterestProvider?: ArenaAreaOfInterestProvider
}
