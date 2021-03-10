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
    }

    const node = RecordFactory.createInstance(recordParams)

    expect(node).toHaveProperty('uuid')

    expect(node).toHaveProperty('ownerUuid')
    expect(node.ownerUuid).toBe(recordParams.user.uuid)

    expect(node).toHaveProperty('ownerName')
    expect(node.ownerName).toBe(recordParams.user.name)

    expect(node).toHaveProperty('preview')
    expect(node.preview).toBe(false)
  })
})
