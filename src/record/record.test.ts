import { UserStatus, UserTitle } from '../auth'
import { RecordFactory, RecordFactoryParams } from './factory'

describe('RecordFactory', () => {
  test('createInstence - record', () => {
    const recordParams: RecordFactoryParams = {
      user: {
        authGroups: [],
        email: 'user@email.com',
        hasProfilePicture: false,
        name: 'user_name',
        prefs: {
          surveys: {
            current: 1,
          },
        },
        props: {
          title: UserTitle.preferNotToSay,
        },
        status: UserStatus.ACCEPTED,
        uuid: 'user_uuid',
      },
      surveyId: 1,
      surveyUuid: 'survey_uuid',
    }

    const record = RecordFactory.createInstance(recordParams)

    expect(record).toHaveProperty('uuid')

    expect(record).toHaveProperty('ownerUuid')
    expect(record.ownerUuid).toBe(recordParams.user.uuid)

    expect(record).toHaveProperty('ownerName')
    expect(record.ownerName).toBe(recordParams.user.name)

    expect(record).toHaveProperty('preview')
    expect(record.preview).toBe(false)

    expect(record).toHaveProperty('surveyId')
    expect(record.surveyId).toBe(recordParams.surveyId)

    expect(record).toHaveProperty('surveyUuid')
    expect(record.surveyUuid).toBe(recordParams.surveyUuid)
  })
})
