import { CategoryItemService, CategoryLevelService, CategoryService } from '../category'
import { ChainNodeDefService, ChainService } from '../chain'
import { NodeService } from '../node'
import { NodeDefService } from '../nodeDef'
import { RecordService } from '../record'
import { SurveyService } from '../survey'
import { TaxonomyService, TaxonService } from '../taxonomy'
import { UserService } from '../auth'

export type Service =
  | CategoryService
  | CategoryItemService
  | CategoryLevelService
  | ChainService
  | ChainNodeDefService
  | NodeService
  | NodeDefService
  | RecordService
  | SurveyService
  | TaxonService
  | TaxonomyService
  | UserService
