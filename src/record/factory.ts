import { Factory } from '../common'
import { User } from '../auth'
import { Record, RECORD_STEP_DEFAULT } from './record'
import { UUIDs } from '../utils'
import { AppInfo } from '../app'

export type RecordFactoryParams = {
  cycle?: string
  dateCreated?: string
  preview?: boolean
  surveyUuid: string
  step?: string
  user: User
  appInfo?: AppInfo
}

export const RecordFactory: Factory<Record, RecordFactoryParams> = {
  createInstance: (params: RecordFactoryParams): Record => {
    const defaultProps = {
      preview: false,
      step: RECORD_STEP_DEFAULT,
    }

    const { appInfo, cycle, dateCreated, preview, step, surveyUuid, user } = {
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
      ...(appInfo ? { info: { createdWith: appInfo } } : {}),
    }
  },
}
