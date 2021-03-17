import { Taxonomy, TaxonomyService } from '../taxonomy'
import { ServiceRegistry } from './serviceRegistry'

// this implementation just for test
class TaxonomyServiceImplementation implements TaxonomyService {
  create(): any {
    return 'create'
  }

  count(): any {
    return 'count'
  }

  getMany(): any {
    return 'getMany Taxonomies'
  }

  get(): any {
    return 'get'
  }

  update(): any {
    return 'update'
  }

  delete(): any {
    return 'delete'
  }
}

describe('ServiceRegistry', () => {
  test('ServiceRegistry - doesnt have taxonomyService registered', () => {
    const service: TaxonomyService = ServiceRegistry.getInstance().getTaxonomyService()
    expect(service).toBeNull()
  })

  test('taxonomyService - register taxonomyService and get the service', async () => {
    const service: TaxonomyService = ServiceRegistry.getInstance()
      .registerTaxonomyService(TaxonomyServiceImplementation)
      .getTaxonomyService()

    expect(service).not.toBeNull()
    const taxonomies: Array<Taxonomy> = await service.getMany({ surveyId: 1 })
    expect(taxonomies).toBe('getMany Taxonomies')
  })

  test('taxonomyService - Check if the taxonomyService is into the singleton registry', async () => {
    const service: TaxonomyService = ServiceRegistry.getInstance().getTaxonomyService()

    expect(service).not.toBeNull()
    const taxonomies: Array<Taxonomy> = await service.getMany({ surveyId: 1 })
    expect(taxonomies).toBe('getMany Taxonomies')
  })
})
