import { ArenaDictionary, ArenaFactory } from '../common'
import { UUIDs } from '../utils'
import { ArenaUser, UserStatus, UserTitle } from './user'

export type UserFactoryParams = {
  email: string
  name: string
  status?: UserStatus
  title?: UserTitle
  extra?: ArenaDictionary<any>
}

export const UserFactory: ArenaFactory<ArenaUser, UserFactoryParams> = {
  createInstance: (params: UserFactoryParams): ArenaUser => {
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
