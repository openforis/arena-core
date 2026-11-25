import { ArenaUser } from '../auth'
import { ArenaExpressionContext } from '../expression'
import { ArenaAnyNodeDef } from '../nodeDef'
import { ArenaSurvey } from '../survey'
import { ArenaAreaOfInterestProvider } from './areaOfInterestProvider'
import { ArenaCategoryItemProvider } from './categoryItemProvider'
import { ArenaTaxonProvider } from './taxonProvider'

export interface NodeDefExpressionContext extends ArenaExpressionContext {
  survey: ArenaSurvey
  user?: ArenaUser
  nodeDefCurrent: ArenaAnyNodeDef
  nodeDefContext?: ArenaAnyNodeDef
  /**
   * Unique UUIDs of node definitions being visited during expression evaluation.
   */
  referencedNodeDefUuids?: Set<string>
  /**
   * Unique UUIDs of entity definitions whose nodes dates are used in the expression (nodeDateCreated, nodeDateModified).
   */
  nodeDateReferencedNodeDefUuids?: Set<string>
  selfReferenceAllowed?: boolean
  // true when the expression is used to filter code or taxon items
  itemsFilter?: boolean
  // true when evaluating the property of a member expression (e.g. "length" in "text_attr.length")
  memberProperty?: boolean

  categoryItemProvider?: ArenaCategoryItemProvider
  taxonProvider?: ArenaTaxonProvider
  areaOfInterestProvider?: ArenaAreaOfInterestProvider
}
