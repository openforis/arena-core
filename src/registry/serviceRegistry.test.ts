import { beforeAll, describe, expect, test } from '@jest/globals'

import { ArenaUserService } from '../auth'
import { ArenaRecordService } from '../record'
import { ArenaSurveyService } from '../survey'

import { ServiceRegistry } from './serviceRegistry'
import { ServiceType } from './serviceType'

import { recordMock, RecordServiceMock } from './tests/record'
import { surveyMock, SurveyServiceMock } from './tests/survey'
import { userMock, UserServiceMock } from './tests/user'

let serviceRegistry: ServiceRegistry

beforeAll(() => {
  serviceRegistry = ServiceRegistry.getInstance()
    .registerService(ServiceType.record, new RecordServiceMock())
    .registerService(ServiceType.survey, new SurveyServiceMock())
    .registerService(ServiceType.user, new UserServiceMock())
})

describe('ServiceRegistry', () => {
  test('RecordService', async () => {
    const service: ArenaRecordService = serviceRegistry.getService(ServiceType.record)
    const record = await service.get({ recordUuid: 'record_uuid', surveyId: 1 })

    expect(service).not.toBeNull()
    expect(record.ownerUuid).toBe(recordMock.ownerUuid)
  })

  test('SurveyService', async () => {
    const service: ArenaSurveyService = serviceRegistry.getService(ServiceType.survey)
    const survey = await service.get({ surveyId: 1 })

    expect(service).not.toBeNull()
    expect(survey.props.name).toBe(surveyMock.props.name)
  })

  test('UserService', async () => {
    const service: ArenaUserService = serviceRegistry.getService(ServiceType.user)
    const user = await service.get({ userUuid: 'userUuid' })

    expect(service).not.toBeNull()
    expect(user).not.toBeNull()
    expect(user?.name).toBe(userMock.name)
  })

  test('getService is typed by ServiceType', () => {
    const userService: ArenaUserService = serviceRegistry.getService(ServiceType.user)
    // @ts-expect-error the service registered for ServiceType.user is not a SurveyService
    const surveyService: ArenaSurveyService = serviceRegistry.getService(ServiceType.user)

    expect(surveyService).toBe(userService)
  })

  test('getService with a custom key', () => {
    const customService = { name: 'custom' }
    serviceRegistry.registerService('custom', customService)

    expect(serviceRegistry.getService<typeof customService>('custom').name).toBe('custom')
    expect(() => serviceRegistry.getService('notRegistered')).toThrow('Service notRegistered not registered')
  })
})
