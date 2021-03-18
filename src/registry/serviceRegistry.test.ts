import { TaxonomyService } from '../taxonomy'
import { ServiceRegistry } from './serviceRegistry'

import { taxonomyMock, TaxonomyServiceMock } from './tests/taxonomy'

beforeAll(() => {
  ServiceRegistry.getInstance().registerTaxonomyService(new TaxonomyServiceMock())
})

describe('ServiceRegistry', () => {
  test('TaxonomyService', async () => {
    const service: TaxonomyService = ServiceRegistry.getInstance().getTaxonomyService()
    const taxonomy = await service.get({ surveyId: 1, taxonomyUuid: 'mock' })

    expect(service).not.toBeNull()
    expect(taxonomy.props.name).toBe(taxonomyMock.props.name)
  })
})
