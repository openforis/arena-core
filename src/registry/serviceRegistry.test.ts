import { TaxonomyService } from '../taxonomy'
import { SurveyService } from '../survey'
import { UserFactory, UserStatus } from '../auth'

import { ServiceRegistry } from './serviceRegistry'

import { taxonomyMock, TaxonomyServiceMock } from './tests/taxonomy'
import { surveyMock, SurveyServiceMock } from './tests/Survey'

export const mockUser = UserFactory.createInstance({
  email: 'mail@mock.org',
  name: 'user_mock',
  status: UserStatus.ACCEPTED,
})

beforeAll(() => {
  ServiceRegistry.getInstance()
    .registerTaxonomyService(new TaxonomyServiceMock())
    .registerSurveyService(new SurveyServiceMock())
})

describe('ServiceRegistry', () => {
  test('TaxonomyService', async () => {
    const service: TaxonomyService = ServiceRegistry.getInstance().getTaxonomyService()
    const taxonomy = await service.get({ surveyId: 1, taxonomyUuid: 'mock' })

    expect(service).not.toBeNull()
    expect(taxonomy.props.name).toBe(taxonomyMock.props.name)
  })

  test('SurveyService', async () => {
    const service: SurveyService = ServiceRegistry.getInstance().getSurveyService()
    const survey = await service.get({ surveyId: 1, user: mockUser })

    expect(service).not.toBeNull()
    expect(survey.props.name).toBe(surveyMock.props.name)
  })
})
