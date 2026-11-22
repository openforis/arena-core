import type { ArenaUserAuthTokenService, ArenaUserService } from '../auth'
import type { ArenaRecordService } from '../record'
import type { ArenaSurveyService } from '../survey'

import { ServiceType } from './serviceType'

/**
 * Type of the service registered for each ServiceType, used to type ServiceRegistry.getService.
 * Being an interface, it can be augmented (declaration merging) with other service types.
 */
export interface ArenaServiceTypeMap {
  [ServiceType.record]: ArenaRecordService
  [ServiceType.survey]: ArenaSurveyService
  [ServiceType.user]: ArenaUserService
  [ServiceType.userAuthToken]: ArenaUserAuthTokenService
}
