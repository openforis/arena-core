import { User, UserFactory, UserService } from '../../auth'

export const userMock: User = UserFactory.createInstance({
  email: 'email@mock.org',
  name: 'survey_name',
})

export class UserServiceMock implements UserService {
  create(): Promise<User> {
    throw new Error('Not implemented')
  }

  count(): Promise<number> {
    throw new Error('Not implemented')
  }

  get(): Promise<User> {
    return Promise.resolve(userMock)
  }

  getMany(): Promise<Array<User>> {
    throw new Error('Not implemented')
  }

  getProfilePicture(): Promise<string> {
    throw new Error('Not implemented')
  }

  update(): Promise<User> {
    throw new Error('Not implemented')
  }

  updateUserPrefs(): Promise<User> {
    throw new Error('Not implemented')
  }

  delete(): Promise<void> {
    throw new Error('Not implemented')
  }
}
