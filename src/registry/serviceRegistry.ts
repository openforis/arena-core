import { CategoryService, CategoryItemService, CategoryLevelService } from '../category'
import { NodeService } from '../node'
import { NodeDefService } from '../nodeDef'
import { RecordService } from '../record'
import { SurveyService } from '../survey'
import { TaxonService, TaxonomyService } from '../taxonomy'
import { UserService } from '../auth'

export type Service =
  | CategoryService
  | CategoryItemService
  | CategoryLevelService
  | NodeService
  | NodeDefService
  | RecordService
  | SurveyService
  | TaxonService
  | TaxonomyService
  | UserService

export enum ServiceTypes {
  category = 'category',
  categoryItem = 'categoryItem',
  categoryLevel = 'categoryLevel',
  node = 'node',
  nodeDef = 'nodeDef',
  record = 'record',
  survey = 'survey',
  taxon = 'taxon',
  taxonomy = 'taxonomy',
  user = 'user',
}

export class ServiceRegistry {
  private static _instance: ServiceRegistry
  private readonly services: { [type in ServiceTypes]?: any }

  private constructor() {
    this.services = {}
  }

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry._instance) {
      ServiceRegistry._instance = new ServiceRegistry()
    }
    return ServiceRegistry._instance
  }

  getService(type: ServiceTypes): any {
    const service = this.services[type]
    if (!service) throw new Error(`Service ${type} not registered`)
    return service
  }

  registerService(type: ServiceTypes, service: Service): ServiceRegistry {
    this.services[type] = service
    return this
  }
}
