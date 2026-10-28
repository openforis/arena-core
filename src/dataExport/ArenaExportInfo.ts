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

export enum ArenaExportType {
  /** Survey (with records when exported as backup) */
  survey = 'survey',
  /** Records only (e.g. records selected in the records list or exported from Arena Mobile) */
  records = 'records',
  /** Survey package downloaded by Arena Mobile (survey with reference data and survey files) */
  mobileSurvey = 'mobileSurvey',
}

export type ArenaExportInfo = {
  appInfo: AppInfo
  dateExported: string // ISO string
  exportedByUserUuid: string
  exportType?: ArenaExportType
  survey: SurveyExportInfo
  options?: ArenaDataExportOptions
}
