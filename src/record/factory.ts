import { Factory } from 'src/common'
import { User } from '../auth/user'
import { Record, RECORD_STEP_DEFAULT } from './record'
import { UUIDs } from '../utils'

export type RecordFactoryParams = {
  cycle?: string
  dateCreated?: string
  preview?: boolean
  step?: string
  user: User
}

export const RecordFactory: Factory<Record> = {
  createInstance: (params: RecordFactoryParams): Record => {
    const defaultProps = {
      preview: false,
      step: RECORD_STEP_DEFAULT,
    }

    const { user, cycle, preview, dateCreated, step } = {
      ...defaultProps,
      ...params,
    }

    return {
      cycle,
      dateCreated,
      ownerUuid: user.uuid,
      ownerName: user.name,
      preview,
      step,
      uuid: UUIDs.v4(),
    }
  },
}
