import { ActivityLog, ActivityLogType } from '../activityLog'
import { Survey } from '../../survey'

export type ActivityLogSurveyCreate = ActivityLog<ActivityLogType.surveyCreate, Survey>
