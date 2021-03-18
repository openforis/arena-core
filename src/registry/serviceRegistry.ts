import { SurveyService } from 'src/survey'
import { TaxonomyService } from '../taxonomy'

enum ServiceTypes {
  survey = 'survey',
  taxonomy = 'taxonomy',
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

  private getService(type: ServiceTypes): any {
    const service = this.services[type]
    if (!service) throw new Error(`Service ${type} not registered`)
    return service
  }

  private registerService(type: ServiceTypes, service: any): ServiceRegistry {
    this.services[type] = service
    return this
  }

  getSurveyService(): SurveyService {
    return this.getService(ServiceTypes.survey)
  }

  registerSurveyService(service: SurveyService): ServiceRegistry {
    return this.registerService(ServiceTypes.survey, service)
  }

  getTaxonomyService(): TaxonomyService {
    return this.getService(ServiceTypes.taxonomy)
  }

  registerTaxonomyService(service: TaxonomyService): ServiceRegistry {
    return this.registerService(ServiceTypes.taxonomy, service)
  }
}
