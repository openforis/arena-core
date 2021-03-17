import { ExpressionContext } from 'src/expression/context'
import { Node } from '../../node'
import { Survey } from '../../survey'
import { Record } from '../record'

export interface RecordExpressionContext extends ExpressionContext {
  survey: Survey
  record: Record
  nodeContext: Node
  nodeCurrent?: Node
}
