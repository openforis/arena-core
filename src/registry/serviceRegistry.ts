import { Service } from './service'

export type ServiceKey = string

export class ServiceRegistry {
  private static _instance: ServiceRegistry
  private readonly services: { [key: string]: Service }

  private constructor() {
    this.services = {}
  }

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry._instance) {
      ServiceRegistry._instance = new ServiceRegistry()
    }
    return ServiceRegistry._instance
  }

  getService<S extends Service>(key: ServiceKey): S {
    const service = this.services[key]
    if (!service) throw new Error(`Service ${key} not registered`)
    return service as S
  }

  registerService(type: ServiceKey, service: Service): ServiceRegistry {
    this.services[type] = service
    return this
  }
}
