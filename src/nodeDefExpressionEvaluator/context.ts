import { ArenaUser } from '../auth'
import { ArenaExpressionContext } from '../expression'
import { ArenaNodeDef } from '../nodeDef'
import { ArenaNodeDefProps, NodeDefType } from '../nodeDef/nodeDef'
import { ArenaSurvey } from '../survey'
import { ArenaAreaOfInterestProvider } from './areaOfInterestProvider'
import { ArenaCategoryItemProvider } from './categoryItemProvider'
import { ArenaTaxonProvider } from './taxonProvider'

export interface NodeDefExpressionContext extends ArenaExpressionContext {
  survey: ArenaSurvey
  user?: ArenaUser
  nodeDefCurrent: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>
  nodeDefContext?: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>
  /**
   * Unique UUIDs of node definitions being visited during expression evaluation.
   */
  referencedNodeDefUuids?: Set<string>
  selfReferenceAllowed?: boolean
  // true when the expression is used to filter code or taxon items
  itemsFilter?: boolean
  // true when evaluating the property of a member expression (e.g. "length" in "text_attr.length")
  memberProperty?: boolean

  categoryItemProvider?: ArenaCategoryItemProvider
  taxonProvider?: ArenaTaxonProvider
  areaOfInterestProvider?: ArenaAreaOfInterestProvider
}
