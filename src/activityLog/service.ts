import { ActivityLogType } from './activityLog'
import { User } from '../auth'

export interface ActivityLogService {
  // ==== CREATE
  create(options: {
    surveyId: number
    user: User
    type: ActivityLogType
    content?: any
    system?: boolean
  }): Promise<null>
}
