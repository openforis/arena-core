import { Factory } from '../common'
import { AuthGroupName, User, Users } from '../auth'
import { ArenaRecord, RECORD_STEP_DEFAULT } from './record'
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

export const RecordFactory: Factory<ArenaRecord, RecordFactoryParams> = {
  createInstance: (params: RecordFactoryParams): ArenaRecord => {
    const defaultProps = {
      preview: false,
      step: RECORD_STEP_DEFAULT,
    }

    const { appInfo, cycle, dateCreated, preview, step, surveyUuid, user } = {
      ...defaultProps,
      ...params,
    }

    const surveyGroup = user.authGroups?.find((group) => group.surveyUuid === surveyUuid)
    const ownerRole = surveyGroup?.name ?? (Users.isSystemAdmin(user) ? AuthGroupName.systemAdmin : undefined)

    return {
      cycle,
      dateCreated,
      ownerEmail: user.email,
      ownerName: user.name,
      ownerRole,
      ownerUuid: user.uuid,
      preview,
      step,
      surveyUuid,
      uuid: UUIDs.v4(),
      ...(appInfo ? { info: { createdWith: appInfo } } : {}),
    }
  },
}
