import { Factory } from 'src/common'
import { User } from '../auth/user'
import { Record } from './record'
import { v4 as uuidv4 } from 'uuid'

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
      step: '1', // TODO RecordStep.getDefaultStep(), const export const getDefaultStep = () => R.pipe(R.head, R.prop(keys.id))(steps)
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
      uuid: uuidv4(),
    }
  },
}
