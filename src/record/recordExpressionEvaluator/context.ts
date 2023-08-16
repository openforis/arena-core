import { ExpressionContext } from '../../expression'
import { Node } from '../../node'
import { Survey } from '../../survey'
import { Record } from '../record'

export interface RecordExpressionContext extends ExpressionContext {
  survey: Survey
  record: Record
  nodeContext: Node
  nodeCurrent?: Node
  item?: any
}
