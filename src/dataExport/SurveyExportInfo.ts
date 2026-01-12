import { AppInfo } from '../app'

export type SurveyExportInfo = {
  appInfo: AppInfo
  dateExported: Date
  exportedByUserUuid: string
  surveyUuid: string
  surveyName: string
  includeData?: boolean
  includeResultAttributes?: boolean
  includeActivityLog?: boolean
}
