import { AppInfo } from '../app'
import { Factory } from '../common'
import { ArenaExportInfo, ArenaDataExportOptions, ArenaExportType, SurveyExportInfo } from './ArenaExportInfo'

export type ArenaExportInfoFactoryParams = {
  appInfo: AppInfo
  exportedByUserUuid: string
  exportType?: ArenaExportType
  survey: SurveyExportInfo
  options?: ArenaDataExportOptions
}

export const ArenaExportInfoFactory: Factory<ArenaExportInfo, ArenaExportInfoFactoryParams> = {
  createInstance: (params: ArenaExportInfoFactoryParams): ArenaExportInfo => ({
    ...params,
    dateExported: new Date().toISOString(),
  }),
}
