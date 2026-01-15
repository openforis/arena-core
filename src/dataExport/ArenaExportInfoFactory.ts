import { AppInfo } from '../app'
import { Factory } from '../common'
import { ArenaExportInfo, ArenaDataExportOptions, SurveyExportInfo } from './ArenaExportInfo'

export type ArenaExportInfoFactoryParams = {
  appInfo: AppInfo
  exportedByUserUuid: string
  surveyInfo: SurveyExportInfo
  exportOptions?: ArenaDataExportOptions
}

export const ArenaExportInfoFactory: Factory<ArenaExportInfo, ArenaExportInfoFactoryParams> = {
  createInstance: (params: ArenaExportInfoFactoryParams): ArenaExportInfo => ({
    ...params,
    dateExported: new Date(),
  }),
}
