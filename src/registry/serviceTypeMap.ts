import type { UserAuthTokenService, UserService } from '../auth'
import type { CategoryItemService, CategoryLevelService, CategoryService } from '../category'
import type { ChainNodeDefService, ChainService } from '../chain'
import type { NodeService } from '../node'
import type { NodeDefService } from '../nodeDef'
import type { RecordService } from '../record'
import type { SurveyService } from '../survey'
import type { TaxonomyService, TaxonService } from '../taxonomy'

import { ServiceType } from './serviceType'

/**
 * Type of the service registered for each ServiceType, used to type ServiceRegistry.getService.
 * Being an interface, it can be augmented (declaration merging) with other service types.
 */
export interface ServiceTypeMap {
  [ServiceType.category]: CategoryService
  [ServiceType.categoryItem]: CategoryItemService
  [ServiceType.categoryLevel]: CategoryLevelService
  [ServiceType.chain]: ChainService
  [ServiceType.chainNodeDef]: ChainNodeDefService
  [ServiceType.node]: NodeService
  [ServiceType.nodeDef]: NodeDefService
  [ServiceType.record]: RecordService
  [ServiceType.survey]: SurveyService
  [ServiceType.taxon]: TaxonService
  [ServiceType.taxonomy]: TaxonomyService
  [ServiceType.user]: UserService
  [ServiceType.userAuthToken]: UserAuthTokenService
}
