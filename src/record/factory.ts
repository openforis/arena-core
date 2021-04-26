import { Factory } from '../common'
import { User } from '../auth'
import { Record, RECORD_STEP_DEFAULT } from './record'
import { UUIDs } from '../utils'

export type RecordFactoryParams = {
  cycle?: string
  dateCreated?: string
  preview?: boolean
  surveyUuid: string
  step?: string
  user: User
}

export const RecordFactory: Factory<Record, RecordFactoryParams> = {
  createInstance: (params: RecordFactoryParams): Record => {
    const defaultProps = {
      preview: false,
      step: RECORD_STEP_DEFAULT,
    }

    const { user, cycle, preview, dateCreated, step, surveyUuid } = {
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
      surveyUuid,
      uuid: UUIDs.v4(),
    }
  },
}
