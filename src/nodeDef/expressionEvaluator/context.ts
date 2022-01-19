import { ExpressionContext } from '../../expression'
import { NodeDef } from '..'
import { Survey } from '../../survey'
import { NodeDefProps, NodeDefType } from '../nodeDef'

export interface NodeDefExpressionContext extends ExpressionContext {
  survey: Survey
  nodeDefCurrent?: NodeDef<NodeDefType, NodeDefProps>
  nodeDefContext?: NodeDef<NodeDefType, NodeDefProps>
  selfReferenceAllowed: boolean
}
