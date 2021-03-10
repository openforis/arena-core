import { Factory } from 'src/common'
import { UUIDs } from 'src/utils'
import { User, UserStatus, UserTitle } from './user'

export type UserFactoryParams = {
  email: string
  name: string
  status?: UserStatus
  title?: UserTitle
  groupUuid: string
}

export const UserFactory: Factory<User> = {
  createInstance: (params: UserFactoryParams): User => {
    const defaultProps = {
      hasProfilePicture: false,
      status: UserStatus.INVITED,
    }

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
      uuid: UUIDs.v4(),
    }
  },
}
