import { ArenaService } from '../common'

export class ServiceRegistry {
  private static _instance: ServiceRegistry
  private readonly services: { [key: string]: ArenaService }

  private constructor() {
    this.services = {}
  }

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry._instance) {
      ServiceRegistry._instance = new ServiceRegistry()
    }
    return ServiceRegistry._instance
  }

  getService<S extends ArenaService>(key: string): S {
    const service = this.services[key]
    if (!service) throw new Error(`Service ${key} not registered`)
    return service as S
  }

  registerService(type: string, service: ArenaService): this {
    this.services[type] = service
    return this
  }

  registerServicesFromRegistry(registry: ServiceRegistry): this {
    Object.entries(registry.services).forEach(([key, service]) => {
      this.registerService(key, service)
    })
    return this
  }
}
