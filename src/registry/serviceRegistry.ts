import { SurveyService } from '../survey'
import { TaxonomyService } from '../taxonomy'
import { UserService } from '../auth'

type Services = SurveyService | TaxonomyService | UserService

export enum ServiceTypes {
  category = 'category',
  categoryItem = 'categoryItem',
  categoryLevel = 'categoryLevel',
  //node
  nodeDef = 'nodeDef',
  //record = 'record',
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

  getService(type: ServiceTypes): Services {
    const service = this.services[type]
    if (!service) throw new Error(`Service ${type} not registered`)
    return service
  }

  registerService(type: ServiceTypes, service: Services): ServiceRegistry {
    this.services[type] = service
    return this
  }
}
