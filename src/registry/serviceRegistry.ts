import { ServiceType } from './serviceType'
import { Service } from './service'

export class ServiceRegistry {
  private static _instance: ServiceRegistry
  private readonly services: { [type in ServiceType]?: Service }

  private constructor() {
    this.services = {}
  }

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry._instance) {
      ServiceRegistry._instance = new ServiceRegistry()
    }
    return ServiceRegistry._instance
  }

  getService(type: ServiceType): Service {
    const service = this.services[type]
    if (!service) throw new Error(`Service ${type} not registered`)
    return service
  }

  registerService(type: ServiceType, service: Service): ServiceRegistry {
    this.services[type] = service
    return this
  }
}
