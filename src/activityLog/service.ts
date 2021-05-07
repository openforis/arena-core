import { ActivityLog, ActivityLogType } from './activityLog'

export interface ActivityLogService {
  // ==== CREATE
  create(options: { type: ActivityLogType; content: any; system: boolean }): Promise<ActivityLog<ActivityLogType, any>>
}
