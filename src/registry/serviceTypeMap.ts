import type { ArenaUserAuthTokenService, ArenaUserService } from '../auth'
import type { ArenaCategoryItemService, ArenaCategoryLevelService, ArenaCategoryService } from '../category'
import type { ArenaChainNodeDefService, ArenaChainService } from '../chain'
import type { ArenaRecordNodeService } from '../node'
import type { ArenaNodeDefService } from '../nodeDef'
import type { ArenaRecordService } from '../record'
import type { ArenaSurveyService } from '../survey'
import type { ArenaTaxonomyService, ArenaTaxonService } from '../taxonomy'

import { ServiceType } from './serviceType'

/**
 * Type of the service registered for each ServiceType, used to type ServiceRegistry.getService.
 * Being an interface, it can be augmented (declaration merging) with other service types.
 */
export interface ArenaServiceTypeMap {
  [ServiceType.category]: ArenaCategoryService
  [ServiceType.categoryItem]: ArenaCategoryItemService
  [ServiceType.categoryLevel]: ArenaCategoryLevelService
  [ServiceType.chain]: ArenaChainService
  [ServiceType.chainNodeDef]: ArenaChainNodeDefService
  [ServiceType.node]: ArenaRecordNodeService
  [ServiceType.nodeDef]: ArenaNodeDefService
  [ServiceType.record]: ArenaRecordService
  [ServiceType.survey]: ArenaSurveyService
  [ServiceType.taxon]: ArenaTaxonService
  [ServiceType.taxonomy]: ArenaTaxonomyService
  [ServiceType.user]: ArenaUserService
  [ServiceType.userAuthToken]: ArenaUserAuthTokenService
}
