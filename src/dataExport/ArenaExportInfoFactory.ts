import { ArenaAppInfo } from '../app'
import { ArenaFactory } from '../common'
import { ArenaExportInfo, ArenaDataExportOptions, ArenaExportType, SurveyExportInfo } from './ArenaExportInfo'

export type ArenaExportInfoFactoryParams = {
  appInfo: ArenaAppInfo
  exportedByUserUuid: string
  exportType?: ArenaExportType
  survey: SurveyExportInfo
  options?: ArenaDataExportOptions
}

export const ArenaExportInfoFactory: ArenaFactory<ArenaExportInfo, ArenaExportInfoFactoryParams> = {
  createInstance: (params: ArenaExportInfoFactoryParams): ArenaExportInfo => ({
    ...params,
    dateExported: new Date().toISOString(),
  }),
}
