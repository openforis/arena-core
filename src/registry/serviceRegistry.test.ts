import { TaxonomyService } from '../taxonomy'
import { SurveyService } from '../survey'
import { UserFactory, UserStatus, UserService } from '../auth'

import { ServiceRegistry } from './serviceRegistry'

import { taxonomyMock, TaxonomyServiceMock } from './tests/taxonomy'
import { surveyMock, SurveyServiceMock } from './tests/survey'
import { userMock, UserServiceMock } from './tests/user'

export const mockUser = UserFactory.createInstance({
  email: 'mail@mock.org',
  name: 'user_mock',
  status: UserStatus.ACCEPTED,
})

beforeAll(() => {
  ServiceRegistry.getInstance()
    .registerTaxonomyService(new TaxonomyServiceMock())
    .registerSurveyService(new SurveyServiceMock())
    .registerUserService(new UserServiceMock())
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

  test('UserService', async () => {
    const service: UserService = ServiceRegistry.getInstance().getUserService()
    const user = await service.get({ userUuid: 'userUuid' })

    expect(service).not.toBeNull()
    expect(user.name).toBe(userMock.name)
  })
})
