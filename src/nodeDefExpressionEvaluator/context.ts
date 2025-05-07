import { User } from '../auth'
import { ExpressionContext } from '../expression'
import { NodeDef } from '../nodeDef'
import { NodeDefProps, NodeDefType } from '../nodeDef/nodeDef'
import { Survey } from '../survey'
import { CategoryItemProvider } from './categoryItemProvider'

export interface NodeDefExpressionContext extends ExpressionContext {
  survey: Survey
  user?: User
  nodeDefCurrent: NodeDef<NodeDefType, NodeDefProps>
  nodeDefContext?: NodeDef<NodeDefType, NodeDefProps>
  /**
   * Unique UUIDs of node definitions being visited during expression evaluation.
   */
  referencedNodeDefUuids?: Set<string>
  selfReferenceAllowed?: boolean
  // true when the expression is used to filter code or taxon items
  itemsFilter?: boolean

  categoryItemProvider?: CategoryItemProvider
}
