import { AppInfo } from '../app'

export type SurveyExportInfo = {
  uuid: string
  name: string
}

export type ArenaDataExportOptions = {
  backup?: boolean
  includeData?: boolean
  includeResultAttributes?: boolean
  includeActivityLog?: boolean
}

export type ArenaExportInfo = {
  appInfo: AppInfo
  dateExported: string // ISO string
  exportedByUserUuid: string
  survey: SurveyExportInfo
  options?: ArenaDataExportOptions
}
