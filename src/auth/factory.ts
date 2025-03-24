import { Dictionary, Factory } from '../common'
import { UUIDs } from '../utils'
import { User, UserStatus, UserTitle } from './user'

export type UserFactoryParams = {
  email: string
  name: string
  status?: UserStatus
  title?: UserTitle
  extra?: Dictionary<any>
}

export const UserFactory: Factory<User, UserFactoryParams> = {
  createInstance: (params: UserFactoryParams): User => {
    const defaultProps = {
      hasProfilePicture: false,
      status: UserStatus.INVITED,
    }

    const { email, name, hasProfilePicture, status, title, extra } = {
      ...defaultProps,
      ...params,
    }

    return {
      email,
      hasProfilePicture,
      name,
      props: {
        title,
        extra,
      },
      status,
      uuid: UUIDs.v4(),
    }
  },
}
