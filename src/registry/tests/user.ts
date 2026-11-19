import { ArenaUser, UserFactory, ArenaUserService } from '../../auth'

export const userMock: ArenaUser = UserFactory.createInstance({
  email: 'email@mock.org',
  name: 'survey_name',
})

export class UserServiceMock implements ArenaUserService {
  create(): Promise<ArenaUser> {
    throw new Error('Not implemented')
  }

  count(): Promise<number> {
    throw new Error('Not implemented')
  }

  get(): Promise<ArenaUser> {
    return Promise.resolve(userMock)
  }

  getMany(): Promise<Array<ArenaUser>> {
    throw new Error('Not implemented')
  }

  getProfilePicture(): Promise<string> {
    throw new Error('Not implemented')
  }

  update(): Promise<ArenaUser> {
    throw new Error('Not implemented')
  }

  updateUserPrefs(): Promise<ArenaUser> {
    throw new Error('Not implemented')
  }

  delete(): Promise<void> {
    throw new Error('Not implemented')
  }
}
