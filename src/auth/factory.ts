import { Factory } from 'src/common'
import { UUIDs } from '../utils'
import { User, UserStatus, UserTitle } from './user'

export type UserFactoryParams = {
  email: string
  name: string
  status?: UserStatus
  title?: UserTitle
}

export const UserFactory: Factory<User, UserFactoryParams> = {
  createInstance: (params: UserFactoryParams): User => {
    const defaultProps = {
      hasProfilePicture: false,
      status: UserStatus.INVITED,
    }

    const { email, name, hasProfilePicture, status, title } = {
      ...defaultProps,
      ...params,
    }

    return {
      email,
      hasProfilePicture,
      name,
      props: {
        title,
      },
      status,
      uuid: UUIDs.v4(),
    }
  },
}
