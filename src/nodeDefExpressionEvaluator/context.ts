import { User } from '../auth'
import { ExpressionContext } from '../expression'
import { NodeDef } from '../nodeDef'
import { NodeDefProps, NodeDefType } from '../nodeDef/nodeDef'
import { Survey } from '../survey'
import { CategoryItemProvider } from './categoryItemProvider'
import { TaxonProvider } from './taxonProvider'

export interface NodeDefReference {
  uuid: string
  path: string
}

export interface NodeDefExpressionContext extends ExpressionContext {
  survey: Survey
  user?: User
  nodeDefCurrent: NodeDef<NodeDefType, NodeDefProps>
  nodeDefContext?: NodeDef<NodeDefType, NodeDefProps>
  /**
   * Unique UUIDs of node definitions being visited during expression evaluation.
   */
  referencedNodeDefUuids?: Set<string>
  /**
   * Map of node paths by source node definition UUID.
   * Key: UUID of the source node def being referenced
   * Value: Expression path used to navigate to nodes of that type in a record (e.g., 'parent().plot_size')
   */
  nodePathsBySourceDefUuid?: Map<string, NodeDefReference>
  /**
   * Current expression path being built during evaluation (e.g., 'parent().plot_size')
   */
  currentExpressionPath?: string
  selfReferenceAllowed?: boolean
  // true when the expression is used to filter code or taxon items
  itemsFilter?: boolean

  categoryItemProvider?: CategoryItemProvider
  taxonProvider?: TaxonProvider
}
