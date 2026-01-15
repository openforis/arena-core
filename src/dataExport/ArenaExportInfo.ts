import { AppInfo } from '../app'

export type SurveyExportInfo = {
  uuid: string
  name: string
}

export type ArenaExportOptions = {
  includeData: boolean
  includeResultAttributes: boolean
  includeActivityLog: boolean
}

export type ArenaExportInfo = {
  appInfo: AppInfo
  dateExported: Date
  exportedByUserUuid: string
  surveyInfo: SurveyExportInfo
  exportOptions?: ArenaExportOptions
}
