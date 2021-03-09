import { Factory } from 'src/common'
import { v4 as uuidv4 } from 'uuid'
import { User, UserStatus, UserTitle } from './user'

export type UserFactoryParams = {
  email: string
  name: string
  status?: UserStatus
  title?: UserTitle
  groupUuid: string
}

// TODO: Use Authgroup factory

const defaultProps = {
  hasProfilePicture: false,
  status: UserStatus.INVITED,
  title: undefined,
  surveys: undefined,
}

export const UserFactory: Factory<User> = {
  createInstance: (params: UserFactoryParams): User => {
    const { email, name, hasProfilePicture, status, title, surveys } = {
      ...defaultProps,
      ...params,
    }

    return {
      email,
      hasProfilePicture,
      name,
      prefs: {
        surveys,
      },
      props: {
        title,
      },
      status,
      uuid: uuidv4(),
    }
  },
}
