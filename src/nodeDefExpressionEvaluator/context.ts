import { ExpressionContext } from '../expression'
import { NodeDef } from '../nodeDef'
import { Survey } from '../survey'
import { NodeDefProps, NodeDefType } from '../nodeDef/nodeDef'

export interface NodeDefExpressionContext extends ExpressionContext {
  survey: Survey
  nodeDefCurrent?: NodeDef<NodeDefType, NodeDefProps>
  nodeDefContext?: NodeDef<NodeDefType, NodeDefProps>
  /**
   * Unique UUIDs of node definitions being visited during expression evaluation.
   */
  referencedNodeDefUuids?: Set<string>
  selfReferenceAllowed?: boolean
  // true when the expression is used to filter code or taxon items
  itemsFilter?: boolean
}
