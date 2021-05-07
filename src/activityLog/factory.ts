import { Factory } from '../common'
import { ActivityLog, ActivityLogType } from './activityLog'

export type ActivityLogFactoryParams = {
  id: number
  userUuid: string
  type: ActivityLogType
  content: any
  system: boolean
}

export const ActivityLogFactory: Factory<ActivityLog<ActivityLogType, any>, ActivityLogFactoryParams> = {
  createInstance: (params: ActivityLogFactoryParams): ActivityLog<ActivityLogType, any> => {
    const defaultProps = {
      system: false,
    }

    const { content, id, type, system, userUuid } = {
      ...defaultProps,
      ...params,
    }

    return {
      content,
      id,
      type,
      system,
      userUuid,
    }
  },
}
