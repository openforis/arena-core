import { UserFactory, UserFactoryParams } from './factory'
import { UserStatus } from './user'

test('ExpectedUser === User', () => {
  const userParams: UserFactoryParams = {
    email: 'email@email.com',
    groupUuid: 'group-0001',
    name: 'name',
  }

  const user = UserFactory.createInstance(userParams)

  expect(user).toHaveProperty('uuid')
  expect(user.uuid).toBeTruthy()

  expect(user).toHaveProperty('name')
  expect(user.name).toBe(userParams.name)

  expect(user).toHaveProperty('email')
  expect(user.email).toBe(userParams.email)

  expect(user.props.title).toBeUndefined()

  expect(user.status).toBe(UserStatus.INVITED)

  expect(user.hasProfilePicture).toBeFalsy()
})
