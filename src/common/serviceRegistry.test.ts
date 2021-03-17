import { ServiceRegistry, Services } from './serviceRegistry'
describe('ServiceRegistry', () => {
  test('ServiceRegistry - doesnt have taxonomyService registered', () => {
    const service = ServiceRegistry.getInstance().getService(Services.taxonomyService)

    expect(service).toBeNull()
  })

  test('taxonomyService - register taxonomyService and get the service', () => {
    const taxonomyService = ServiceRegistry.getInstance()
      .registerService(Services.taxonomyService)
      .getService(Services.taxonomyService)

    expect(taxonomyService).toBe('TaxonomyService')
  })

  test('taxonomyService - Check if the taxonomyService is into the singleton registry', () => {
    const taxonomyService = ServiceRegistry.getInstance().getService(Services.taxonomyService)

    expect(taxonomyService).not.toBeNull()
    expect(taxonomyService).toBe('TaxonomyService')
  })
})
